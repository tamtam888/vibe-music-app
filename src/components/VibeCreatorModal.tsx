import { useState, useRef, useEffect } from "react";
import { Playlist, Track, SpotifyItemType } from "@/data/playlists";
import { supabase } from "@/integrations/supabase/client";
import { REQUIRED_VIBE_IDS, generateTrackId, generateVibeId } from "@/hooks/useVibeLibrary";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { supabaseConfigured, uploadMp3 } from "@/lib/supabase";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Trash2, ChevronUp, ChevronDown, RotateCcw, Upload, Loader2, X, ExternalLink, Pencil, ListMusic } from "lucide-react";

interface VibeCreatorModalProps {
  open: boolean;
  onClose: () => void;
  vibes: Playlist[];
  onUpdateVibe: (id: string, updates: Partial<Omit<Playlist, "id" | "tracks">>) => void;
  onAddTrack: (vibeId: string, track: Track) => void;
  onRemoveTrack: (vibeId: string, trackId: string) => void;
  onMoveTrack: (vibeId: string, fromIndex: number, toIndex: number) => void;
  onReset: () => void;
  onAddCustomVibe?: (vibe: Playlist) => void;
  onRemoveCustomVibe?: (vibeId: string) => void;
  /** When true, modal opens directly to the create-new-vibe form. */
  openOnNew?: boolean;
}

const EMOJI_OPTIONS = ["🕺", "🎸", "🎤", "💪", "🇮🇱", "🎉", "🎹", "🥁", "🎺", "💿", "🌙", "☀️"];
const COLOR_OPTIONS = [
  "from-fuchsia-900 to-purple-950",
  "from-slate-800 to-zinc-950",
  "from-pink-800 to-rose-950",
  "from-red-900 to-orange-950",
  "from-blue-900 to-sky-950",
  "from-emerald-900 to-teal-950",
  "from-violet-900 to-indigo-950",
  "from-cyan-900 to-teal-950",
];

function isValidAudioUrl(url: string): boolean {
  if (!url.trim()) return false;
  try {
    const u = new URL(url);
    if (!["http:", "https:"].includes(u.protocol)) return false;
    if (/\.(mp3|wav|ogg|m4a|flac)(\?.*)?$/i.test(u.pathname)) return true;
    if (u.hostname.includes("soundhelix") || u.hostname.includes("audio") || u.hostname.includes("supabase")) return true;
    return false;
  } catch {
    return false;
  }
}

function parseSpotifyUrl(url: string): { type: SpotifyItemType; id: string } | null {
  if (!url.trim()) return null;
  try {
    const u = new URL(url);
    if (!u.hostname.includes("spotify.com")) return null;
    const match = u.pathname.match(/^\/(track|album|playlist)\/([a-zA-Z0-9]+)/);
    if (!match) return null;
    const typeMap: Record<string, SpotifyItemType> = {
      track: "spotify_track",
      album: "spotify_album",
      playlist: "spotify_playlist",
    };
    return { type: typeMap[match[1]], id: match[2] };
  } catch {
    return null;
  }
}

const SPOTIFY_LABEL: Record<SpotifyItemType, string> = {
  spotify_track: "Track",
  spotify_album: "Album",
  spotify_playlist: "Playlist",
};

const VibeCreatorModal = ({
  open,
  onClose,
  vibes,
  onUpdateVibe,
  onAddTrack,
  onRemoveTrack,
  onMoveTrack,
  onReset,
  onAddCustomVibe,
  onRemoveCustomVibe,
  openOnNew,
}: VibeCreatorModalProps) => {
  const [selectedVibeId, setSelectedVibeId] = useState<string>(vibes[0]?.id || "");
  const [newTitle, setNewTitle] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [newArtist, setNewArtist] = useState("");
  const [urlError, setUrlError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");
  const [uploadError, setUploadError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // New vibe creation state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createEmoji, setCreateEmoji] = useState("🎵");
  const [createDesc, setCreateDesc] = useState("");
  const [createColor, setCreateColor] = useState(COLOR_OPTIONS[0]);

  // Edit custom vibe state
  const [editingColor, setEditingColor] = useState(false);

  // Delete confirmation state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  // Open directly to create form when triggered from the main UI
  useEffect(() => {
    if (open && openOnNew) setShowCreateForm(true);
  }, [open, openOnNew]);

  const selectedVibe = vibes.find((v) => v.id === selectedVibeId);
  const isCustomVibe = selectedVibe && !REQUIRED_VIBE_IDS.includes(selectedVibe.id);

  const [fetchingMetadata, setFetchingMetadata] = useState(false);
  const [importingTrackId, setImportingTrackId] = useState<string | null>(null);
  const fetchSpotifyMetadata = async (spotifyUrl: string): Promise<{ title: string; subtitle: string; image: string | null; spotify_id: string; item_type: string } | null> => {
    try {
      const { data, error } = await supabase.functions.invoke("spotify-metadata", {
        body: { url: spotifyUrl },
      });
      if (error || !data || data.error) return null;
      return data;
    } catch {
      return null;
    }
  };

  const handleImportTracks = async (track: Track) => {
    if (!selectedVibe || !track.spotify_url) return;
    setImportingTrackId(track.id);
    try {
      const { data, error } = await supabase.functions.invoke("spotify-tracks", {
        body: { url: track.spotify_url },
      });
      if (error || !data || data.error || !data.tracks?.length) {
        setImportingTrackId(null);
        return;
      }
      // Remove the parent album/playlist item and add individual tracks
      onRemoveTrack(selectedVibe.id, track.id);
      for (const t of data.tracks) {
        const newTrack: Track = {
          id: `spotify-${t.spotify_id}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          title: t.title,
          artist: t.artist,
          duration: t.duration || "—",
          url: t.spotify_url || track.spotify_url!,
          source: "spotify",
          spotify_url: t.spotify_url || undefined,
          spotify_id: t.spotify_id || undefined,
          item_type: "spotify_track",
          image: t.image || track.image || undefined,
          metadata_fetched_at: new Date().toISOString(),
        };
        onAddTrack(selectedVibe.id, newTrack);
      }
    } catch {
      // Silently fail — the original link stays
    }
    setImportingTrackId(null);
  };


  const addTrackFromUrl = async () => {
    if (!selectedVibe) return;
    const trimmedUrl = newUrl.trim();
    const trimmedTitle = newTitle.trim();

    // Check if it's a Spotify URL
    const spotifyInfo = parseSpotifyUrl(trimmedUrl);
    if (spotifyInfo) {
      // Immediately clear inputs and show loading
      setNewTitle("");
      setNewUrl("");
      setNewArtist("");
      setUrlError("");
      setFetchingMetadata(true);

      const metadata = await fetchSpotifyMetadata(trimmedUrl);
      setFetchingMetadata(false);

      const title = trimmedTitle || metadata?.title || `Spotify ${SPOTIFY_LABEL[spotifyInfo.type]}`;
      const artist = newArtist.trim() || metadata?.subtitle || "Spotify";
      const track: Track = {
        id: `spotify-${spotifyInfo.id}-${Date.now()}`,
        title,
        artist,
        duration: "—",
        url: trimmedUrl,
        source: "spotify",
        spotify_url: trimmedUrl,
        spotify_id: metadata?.spotify_id || spotifyInfo.id,
        item_type: spotifyInfo.type,
        subtitle: metadata?.subtitle || undefined,
        image: metadata?.image || undefined,
        metadata_fetched_at: metadata ? new Date().toISOString() : undefined,
      };
      onAddTrack(selectedVibe.id, track);
      return;
    }

    if (!trimmedTitle) return;
    if (!isValidAudioUrl(trimmedUrl)) {
      setUrlError("Must be an audio URL (.mp3, .wav) or a Spotify link");
      return;
    }

    const track: Track = {
      id: generateTrackId(),
      title: trimmedTitle,
      artist: newArtist.trim() || "Unknown Artist",
      duration: "—",
      url: trimmedUrl,
    };

    onAddTrack(selectedVibe.id, track);
    setNewTitle("");
    setNewUrl("");
    setNewArtist("");
    setUrlError("");
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !selectedVibe) return;

    const audioFiles = Array.from(files).filter(
      (f) => f.type.startsWith("audio/") || f.name.match(/\.(mp3|wav|ogg|m4a|flac)$/i)
    );

    if (audioFiles.length === 0) {
      setUploadError("Please select audio files (.mp3, .wav, etc.)");
      return;
    }

    setUploading(true);
    setUploadError("");
    const errors: string[] = [];

    for (let i = 0; i < audioFiles.length; i++) {
      const file = audioFiles[i];
      setUploadProgress(`Uploading ${i + 1}/${audioFiles.length}`);
      try {
        const publicUrl = await uploadMp3(selectedVibe.id, file);
        const title = file.name.replace(/\.[^.]+$/, "");
        const track: Track = {
          id: generateTrackId(),
          title,
          artist: newArtist.trim() || "Unknown Artist",
          duration: "—",
          url: publicUrl,
        };
        onAddTrack(selectedVibe.id, track);
      } catch (err: any) {
        errors.push(`${file.name}: ${err.message || "failed"}`);
      }
    }

    setUploading(false);
    setUploadProgress("");
    if (errors.length > 0) {
      setUploadError(errors.join("; "));
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleCreateVibe = () => {
    const name = createName.trim();
    if (!name || !onAddCustomVibe) return;
    const id = generateVibeId();
    const newVibe: Playlist = {
      id,
      name,
      emoji: createEmoji,
      description: createDesc.trim() || "",
      color: createColor,
      tracks: [],
    };
    onAddCustomVibe(newVibe);
    setSelectedVibeId(id);
    setShowCreateForm(false);
    setCreateName("");
    setCreateEmoji("🎵");
    setCreateDesc("");
    setCreateColor(COLOR_OPTIONS[0]);
  };

  const handleDeleteCustomVibe = () => {
    if (!selectedVibe || !isCustomVibe || !onRemoveCustomVibe) return;
    onRemoveCustomVibe(selectedVibe.id);
    setDeleteConfirmOpen(false);
    setSelectedVibeId(vibes.find(v => v.id !== selectedVibe.id)?.id || vibes[0]?.id || "");
  };

  return (
    <>
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        className="max-w-lg border-amber-900/50 max-h-[85vh] overflow-hidden flex flex-col"
        style={{
          background: "linear-gradient(145deg, hsl(30 25% 8%) 0%, hsl(30 20% 5%) 100%)",
        }}
      >
        <DialogHeader>
          <DialogTitle className="text-amber-200 font-bold tracking-wider uppercase text-sm">
            Vibe Library Editor
          </DialogTitle>
        </DialogHeader>

        {/* Storage status */}
        {!supabaseConfigured && (
          <div className="px-3 py-2 rounded-lg bg-amber-950/50 border border-amber-800/30 text-[10px] text-amber-400/70">
            ⚠ Cloud storage not configured — file uploads disabled. Add tracks by URL instead.
          </div>
        )}

        {/* Vibe selector tabs + Add New Vibe button */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none items-center">
          {vibes.map((v) => (
            <button
              key={v.id}
              onClick={() => { setSelectedVibeId(v.id); setShowCreateForm(false); }}
              className={cn(
                "flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider whitespace-nowrap transition-all",
                "border",
                selectedVibeId === v.id && !showCreateForm
                  ? "bg-amber-900/50 border-amber-600/50 text-amber-200"
                  : "bg-amber-950/30 border-amber-900/30 text-amber-400/60 hover:text-amber-300"
              )}
            >
              <span>{v.emoji}</span>
              <span>{v.name}</span>
              {!REQUIRED_VIBE_IDS.includes(v.id) && (
                <span className="text-[8px] text-amber-500/40 ml-0.5">✦</span>
              )}
            </button>
          ))}
          {onAddCustomVibe && (
            <button
              onClick={() => setShowCreateForm(true)}
              className={cn(
                "flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider whitespace-nowrap transition-all border",
                showCreateForm
                  ? "bg-emerald-900/50 border-emerald-600/50 text-emerald-200"
                  : "bg-emerald-950/30 border-emerald-800/30 text-emerald-400/60 hover:text-emerald-300 hover:border-emerald-700/40"
              )}
            >
              <Plus size={12} />
              <span>New</span>
            </button>
          )}
        </div>

        {/* Create new vibe form */}
        {showCreateForm && (
          <div className="space-y-3 border border-emerald-800/30 rounded-lg p-3 bg-emerald-950/20">
            <label className="text-[10px] uppercase tracking-widest text-emerald-400/70 font-bold block">
              Create New Vibe
            </label>
            <div className="grid grid-cols-2 gap-2">
              <Input
                placeholder="Vibe name"
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                className="bg-amber-950/40 border-amber-900/40 text-amber-200 text-xs h-8 placeholder:text-amber-700/40"
                maxLength={20}
              />
              <div className="flex gap-1 flex-wrap items-center">
                {["🎵", "🔥", "💜", "🌊", "🎶", "⭐", "🌙", "🎧"].map((em) => (
                  <button
                    key={em}
                    onClick={() => setCreateEmoji(em)}
                    className={cn(
                      "w-6 h-6 rounded text-sm flex items-center justify-center transition-all",
                      createEmoji === em
                        ? "bg-emerald-800/60 ring-1 ring-emerald-500/50"
                        : "bg-amber-950/30 hover:bg-amber-900/30"
                    )}
                  >
                    {em}
                  </button>
                ))}
              </div>
            </div>
            <Input
              placeholder="Short description (optional)"
              value={createDesc}
              onChange={(e) => setCreateDesc(e.target.value)}
              className="bg-amber-950/40 border-amber-900/40 text-amber-200 text-xs h-8 placeholder:text-amber-700/40"
              maxLength={50}
            />
            <div className="flex gap-1.5 items-center">
              <span className="text-[10px] text-amber-500/50 font-bold uppercase tracking-wider">Color:</span>
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c}
                  onClick={() => setCreateColor(c)}
                  className={cn(
                    "w-5 h-5 rounded-full bg-gradient-to-br transition-all",
                    c,
                    createColor === c ? "ring-2 ring-emerald-400/60 scale-110" : "opacity-60 hover:opacity-100"
                  )}
                />
              ))}
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowCreateForm(false)}
                className="text-amber-500/50 hover:text-amber-300 text-xs"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateVibe}
                size="sm"
                disabled={!createName.trim()}
                className="bg-emerald-800 hover:bg-emerald-700 text-emerald-100 border border-emerald-600/50 text-xs"
              >
                <Plus size={12} />
                Create Vibe
              </Button>
            </div>
          </div>
        )}

        {selectedVibe && !showCreateForm && (
          <div className="flex-1 overflow-y-auto space-y-4 pr-1">
            {/* Delete custom vibe button */}
            {isCustomVibe && onRemoveCustomVibe && (
              <div className="flex justify-between items-center">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditingColor((p) => !p)}
                  className="text-amber-400/60 hover:text-amber-300 text-[10px] gap-1 h-6"
                >
                  <Pencil size={10} />
                  {editingColor ? "Hide Color" : "Edit Color"}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDeleteConfirmOpen(true)}
                  className="text-red-400/60 hover:text-red-400 text-[10px] gap-1 h-6"
                >
                  <X size={10} />
                  Delete Vibe
                </Button>
              </div>
            )}

            {/* Color picker for custom vibes */}
            {isCustomVibe && editingColor && (
              <div className="flex gap-1.5 items-center">
                <span className="text-[10px] text-amber-500/50 font-bold uppercase tracking-wider">Color:</span>
                {COLOR_OPTIONS.map((c) => (
                  <button
                    key={c}
                    onClick={() => onUpdateVibe(selectedVibe.id, { color: c })}
                    className={cn(
                      "w-5 h-5 rounded-full bg-gradient-to-br transition-all",
                      c,
                      selectedVibe.color === c ? "ring-2 ring-amber-400/60 scale-110" : "opacity-60 hover:opacity-100"
                    )}
                  />
                ))}
              </div>
            )}

            {/* Edit vibe metadata */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] uppercase tracking-widest text-amber-500/50 font-bold mb-1 block">
                  Label
                </label>
                <Input
                  value={selectedVibe.name}
                  onChange={(e) => onUpdateVibe(selectedVibe.id, { name: e.target.value })}
                  className="bg-amber-950/40 border-amber-900/40 text-amber-200 text-sm h-8"
                  maxLength={20}
                />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-widest text-amber-500/50 font-bold mb-1 block">
                  Emoji
                </label>
                <div className="flex gap-1 flex-wrap">
                  {EMOJI_OPTIONS.map((em) => (
                    <button
                      key={em}
                      onClick={() => onUpdateVibe(selectedVibe.id, { emoji: em })}
                      className={cn(
                        "w-7 h-7 rounded-md text-sm flex items-center justify-center transition-all",
                        selectedVibe.emoji === em
                          ? "bg-amber-800/60 ring-1 ring-amber-500/50"
                          : "bg-amber-950/30 hover:bg-amber-900/30"
                      )}
                    >
                      {em}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="text-[10px] uppercase tracking-widest text-amber-500/50 font-bold mb-1 block">
                Description
              </label>
              <Input
                value={selectedVibe.description}
                onChange={(e) => onUpdateVibe(selectedVibe.id, { description: e.target.value })}
                className="bg-amber-950/40 border-amber-900/40 text-amber-200 text-sm h-8"
                maxLength={50}
              />
            </div>

            {/* Track list */}
            <div>
              <label className="text-[10px] uppercase tracking-widest text-amber-500/50 font-bold mb-2 block">
                Tracks ({selectedVibe.tracks.length})
              </label>
              <div className="space-y-1 max-h-36 overflow-y-auto">
                {selectedVibe.tracks.map((track, i) => (
                  <div
                    key={track.id}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-amber-950/30 border border-amber-900/20 group"
                  >
                    <span className="text-[10px] font-mono text-amber-500/40 w-4 text-right">{i + 1}</span>
                    {track.source === "spotify" && track.image && (
                      <img
                        src={track.image}
                        alt=""
                        className="w-8 h-8 rounded flex-shrink-0 object-cover"
                      />
                    )}
                    {track.source === "spotify" && !track.image && (
                      <span className="w-8 h-8 rounded flex-shrink-0 bg-green-900/30 flex items-center justify-center">
                        <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-green-400/60"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/></svg>
                      </span>
                    )}
                    {track.source === "spotify" && (
                      <span className="flex-shrink-0 inline-flex items-center gap-0.5 px-1 py-0.5 rounded bg-green-900/40 border border-green-700/30 text-[8px] text-green-400 font-bold uppercase">
                        <svg viewBox="0 0 24 24" fill="currentColor" className="w-2.5 h-2.5"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/></svg>
                        {track.item_type ? SPOTIFY_LABEL[track.item_type] : "Spotify"}
                      </span>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        <p className="text-xs text-amber-300/80 truncate">{track.title}</p>
                        {track.source === "spotify" && track.spotify_url && (
                          <a
                            href={track.spotify_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-shrink-0 text-green-500/50 hover:text-green-400 transition-colors"
                            title="Open in Spotify"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <ExternalLink size={10} />
                          </a>
                        )}
                      </div>
                      <p className="text-[9px] text-amber-500/40 truncate">{track.artist}</p>
                      {track.source === "spotify" && (track.item_type === "spotify_album" || track.item_type === "spotify_playlist") && (
                        <button
                          onClick={() => handleImportTracks(track)}
                          disabled={importingTrackId === track.id}
                          className="inline-flex items-center gap-0.5 mt-0.5 text-[9px] text-green-400/70 hover:text-green-300 transition-colors disabled:opacity-50"
                        >
                          {importingTrackId === track.id ? (
                            <><Loader2 size={9} className="animate-spin" /> Importing…</>
                          ) : (
                            <><ListMusic size={9} /> Import Tracks</>
                          )}
                        </button>
                      )}
                    </div>
                    <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => i > 0 && onMoveTrack(selectedVibe.id, i, i - 1)}
                        className="p-0.5 text-amber-500/50 hover:text-amber-300 disabled:opacity-30"
                        disabled={i === 0}
                      >
                        <ChevronUp size={12} />
                      </button>
                      <button
                        onClick={() =>
                          i < selectedVibe.tracks.length - 1 &&
                          onMoveTrack(selectedVibe.id, i, i + 1)
                        }
                        className="p-0.5 text-amber-500/50 hover:text-amber-300 disabled:opacity-30"
                        disabled={i === selectedVibe.tracks.length - 1}
                      >
                        <ChevronDown size={12} />
                      </button>
                      <button
                        onClick={() => onRemoveTrack(selectedVibe.id, track.id)}
                        className="p-0.5 text-red-400/50 hover:text-red-400"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))}
                {selectedVibe.tracks.length === 0 && (
                  <p className="text-xs text-amber-500/30 text-center py-3">No tracks yet</p>
                )}
              </div>
            </div>

            {/* Add track form */}
            <div className="space-y-2 border-t border-amber-900/20 pt-3">
              <label className="text-[10px] uppercase tracking-widest text-amber-500/50 font-bold block">
                Add Track
              </label>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  placeholder="Track title"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="bg-amber-950/40 border-amber-900/40 text-amber-200 text-xs h-8 placeholder:text-amber-700/40"
                  maxLength={60}
                />
                <Input
                  placeholder="Artist (optional)"
                  value={newArtist}
                  onChange={(e) => setNewArtist(e.target.value)}
                  className="bg-amber-950/40 border-amber-900/40 text-amber-200 text-xs h-8 placeholder:text-amber-700/40"
                  maxLength={40}
                />
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <Input
                    placeholder="Audio URL or Spotify link"
                    value={newUrl}
                    onChange={(e) => {
                      setNewUrl(e.target.value);
                      if (urlError) setUrlError("");
                    }}
                    className={cn(
                      "bg-amber-950/40 border-amber-900/40 text-amber-200 text-xs h-8 placeholder:text-amber-700/40",
                      urlError && "border-red-500/50"
                    )}
                  />
                  {urlError && (
                    <p className="text-[10px] text-red-400/80 mt-0.5">{urlError}</p>
                  )}
                  {fetchingMetadata && (
                    <p className="text-[10px] text-green-400/70 mt-0.5 flex items-center gap-1">
                      <Loader2 size={10} className="animate-spin" />
                      Fetching Spotify metadata…
                    </p>
                  )}
                </div>
                <Button
                  onClick={addTrackFromUrl}
                  size="sm"
                  disabled={fetchingMetadata}
                  className="h-8 px-3 bg-amber-800 hover:bg-amber-700 text-amber-100 border border-amber-600/50"
                >
                  <Plus size={14} />
                </Button>
              </div>

              {/* Upload MP3 */}
              {supabaseConfigured && (
                <div className="space-y-1">
                  <div className="flex gap-2 items-center">
                    <label
                      htmlFor="mp3-upload"
                      className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-md text-xs font-medium cursor-pointer transition-all border ${
                        uploading
                          ? "opacity-50 pointer-events-none bg-amber-950/40 border-amber-900/40 text-amber-400/60"
                          : "bg-amber-900/60 hover:bg-amber-800 text-amber-200 border-amber-700/40"
                      }`}
                    >
                      <Upload size={12} />
                      Choose files
                    </label>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="audio/*,.mp3,.wav,.ogg,.m4a,.flac"
                      multiple
                      onChange={handleFileUpload}
                      id="mp3-upload"
                      className="hidden"
                    />
                    {uploading && (
                      <span className="text-xs text-amber-400/70 flex items-center gap-1">
                        <Loader2 size={12} className="animate-spin" />
                        {uploadProgress || "Uploading…"}
                      </span>
                    )}
                  </div>
                  {fileInputRef.current?.files && fileInputRef.current.files.length > 0 && !uploading && (
                    <p className="text-[10px] text-amber-500/50">Selected: {fileInputRef.current.files.length} files</p>
                  )}
                </div>
              )}
              {uploadError && (
                <p className="text-[10px] text-red-400/80">{uploadError}</p>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-amber-900/20">
          <Button
            variant="ghost"
            size="sm"
            onClick={onReset}
            className="text-amber-500/50 hover:text-amber-300 text-xs gap-1"
          >
            <RotateCcw size={12} />
            Reset Defaults
          </Button>
          <Button
            onClick={onClose}
            size="sm"
            className="bg-amber-800 hover:bg-amber-700 text-amber-100 border border-amber-600/50 text-xs"
          >
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>

      {/* Delete confirmation dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent
          className="border-red-900/50"
          style={{
            background: "linear-gradient(145deg, hsl(30 25% 8%) 0%, hsl(30 20% 5%) 100%)",
          }}
        >
          <AlertDialogHeader>
            <AlertDialogTitle className="text-amber-200">Delete "{selectedVibe?.name}"?</AlertDialogTitle>
            <AlertDialogDescription className="text-amber-400/70">
              This will permanently delete this custom vibe and all its tracks. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-amber-950/40 border-amber-900/40 text-amber-300 hover:bg-amber-900/40 hover:text-amber-200">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCustomVibe}
              className="bg-red-900 hover:bg-red-800 text-red-100 border border-red-700/50"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default VibeCreatorModal;
