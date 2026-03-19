/**
 * SharePage — displays a shared mix from a URL-encoded payload.
 *
 * URL format: /share#<base64(JSON)>
 * The JSON shape is defined by getMixShareUrl() in useSavedMixes.ts.
 *
 * No auth required — the mix data is fully self-contained in the URL.
 */
import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Track } from "@/data/playlists";
import { useAudioPlayer } from "@/hooks/useAudioPlayer";
import { useTheme } from "@/contexts/ThemeContext";
import PlayerControls from "@/components/PlayerControls";
import VinylRecord from "@/components/VinylRecord";
import { Disc3, ListMusic, ExternalLink } from "lucide-react";
import { toast } from "sonner";

interface SharedMixPayload {
  n: string;           // mix name
  by?: string;         // creator display name (optional)
  t: {
    i: string;         // id
    ti: string;        // title
    a: string;         // artist
    d: string;         // duration
    u: string;         // url
    bpm?: number;
  }[];
}

function decodeMix(hash: string): SharedMixPayload | null {
  if (!hash) return null;
  try {
    return JSON.parse(decodeURIComponent(atob(hash)));
  } catch {
    return null;
  }
}

const SharePage = () => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const player = useAudioPlayer();

  const [payload, setPayload] = useState<SharedMixPayload | null>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [invalid, setInvalid] = useState(false);

  useEffect(() => {
    const hash = window.location.hash.slice(1);
    const decoded = decodeMix(hash);
    if (!decoded || !decoded.t?.length) {
      setInvalid(true);
      return;
    }
    setPayload(decoded);
    const parsed: Track[] = decoded.t.map((t) => ({
      id: t.i,
      title: t.ti,
      artist: t.a,
      duration: t.d,
      url: t.u,
      bpm: t.bpm,
    }));
    setTracks(parsed);
  }, []);

  const handlePlay = useCallback(() => {
    if (tracks.length === 0) return;
    player.startPlaylist(tracks, 0);
    toast("Playing shared mix ▶");
  }, [tracks, player]);

  const isDark = theme === "dark";
  const titleColor = isDark ? "rgba(212,160,86,0.9)" : "rgba(91,58,20,0.9)";
  const subtitleColor = isDark ? "rgba(212,160,86,0.45)" : "rgba(91,58,20,0.45)";
  const cardBg = isDark
    ? "rgba(28,18,6,0.96)"
    : "rgba(255,248,235,0.97)";
  const cardBorder = isDark
    ? "rgba(120,60,10,0.35)"
    : "rgba(180,130,60,0.3)";

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        background: isDark
          ? "linear-gradient(to bottom, #1a0f05, #110a03, #0d0703)"
          : "linear-gradient(to bottom, #fef3c7, #fde68a, #fcd34d)",
      }}
    >
      <div className="w-full max-w-md mx-auto">

        {/* Header */}
        <div className="text-center mb-5">
          <div className="inline-flex items-center gap-2 mb-1">
            <Disc3 style={{ color: isDark ? "#d97706" : "#92400e" }} size={18} />
            <h1
              className="text-xl font-bold tracking-[0.3em] uppercase"
              style={{
                background: isDark
                  ? "linear-gradient(180deg, #fcd34d, #b45309)"
                  : "linear-gradient(180deg, #92400e, #78350f)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              VIBE Music
            </h1>
            <Disc3 style={{ color: isDark ? "#d97706" : "#92400e" }} size={18} />
          </div>
          <p className="text-[9px] uppercase tracking-[0.4em] font-medium" style={{ color: subtitleColor }}>
            Shared Mix
          </p>
        </div>

        {/* Card */}
        <div
          className="rounded-3xl p-6 shadow-2xl"
          style={{ background: cardBg, border: `1px solid ${cardBorder}` }}
        >
          {invalid ? (
            <div className="text-center py-8">
              <ListMusic size={32} className="mx-auto mb-3 text-amber-500/30" />
              <p className="text-sm font-semibold text-amber-300/60">Invalid or expired share link</p>
              <button
                onClick={() => navigate("/")}
                className="mt-4 text-xs text-amber-400/60 hover:text-amber-300 underline"
              >
                Open Vibe Music
              </button>
            </div>
          ) : !payload ? (
            <div className="text-center py-8">
              <p className="text-xs text-amber-500/40 animate-pulse uppercase tracking-widest">Loading…</p>
            </div>
          ) : (
            <>
              <VinylRecord isSpinning={player.isPlaying} emoji="🎵" />

              {/* Mix info */}
              <div className="text-center mb-4">
                <h2
                  className="text-base font-bold tracking-wide"
                  style={{ color: titleColor }}
                >
                  {payload.n}
                </h2>
                {payload.by && (
                  <p className="text-[10px] mt-0.5" style={{ color: subtitleColor }}>
                    by {payload.by}
                  </p>
                )}
                <p className="text-[10px] mt-1" style={{ color: subtitleColor }}>
                  {tracks.length} track{tracks.length !== 1 ? "s" : ""}
                </p>
              </div>

              {/* Now playing */}
              {player.currentTrack && (
                <div className="text-center mb-3 px-4">
                  <p className="text-amber-200 font-semibold text-sm truncate">
                    {player.currentTrack.title}
                  </p>
                  <p className="text-amber-500/50 text-xs truncate">
                    {player.currentTrack.artist}
                  </p>
                </div>
              )}

              {/* Player controls */}
              {player.currentTrack ? (
                <PlayerControls
                  theme={theme}
                  isPlaying={player.isPlaying}
                  currentTime={player.currentTime}
                  duration={player.duration}
                  volume={player.volume}
                  shuffle={player.shuffle}
                  aiFlow={false}
                  beatMatch={false}
                  onTogglePlay={player.togglePlay}
                  onToggleShuffle={player.toggleShuffle}
                  onToggleAIFlow={() => {}}
                  onToggleBeatMatch={() => {}}
                  onNext={player.playNext}
                  onPrev={player.playPrev}
                  onSeek={player.seek}
                  onVolumeChange={player.changeVolume}
                />
              ) : (
                /* Play button before first play */
                <div className="flex flex-col items-center gap-3 mt-2">
                  <button
                    onClick={handlePlay}
                    className="px-6 py-2.5 rounded-xl font-bold text-sm uppercase tracking-wider transition-all bg-gradient-to-b from-amber-700 to-amber-900 text-amber-100 hover:from-amber-600 hover:to-amber-800 shadow-lg border border-amber-600/50"
                  >
                    ▶ Play Mix
                  </button>
                </div>
              )}

              {/* Track list */}
              <div className="mt-4 space-y-1 max-h-48 overflow-y-auto">
                {tracks.map((track, i) => (
                  <div
                    key={track.id}
                    onClick={() => player.startPlaylist(tracks, i)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg cursor-pointer transition-all ${
                      player.currentTrack?.id === track.id
                        ? "bg-amber-800/40 border border-amber-700/40"
                        : "hover:bg-amber-900/20"
                    }`}
                  >
                    <span className="text-[10px] w-4 text-right shrink-0" style={{ color: subtitleColor }}>
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-medium truncate" style={{ color: titleColor }}>
                        {track.title}
                      </p>
                      <p className="text-[9px] truncate" style={{ color: subtitleColor }}>
                        {track.artist}
                      </p>
                    </div>
                    <span className="text-[9px] shrink-0" style={{ color: subtitleColor }}>
                      {track.duration}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Footer CTA */}
        <div className="text-center mt-4">
          <button
            onClick={() => navigate("/")}
            className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider font-medium hover:underline"
            style={{ color: subtitleColor }}
          >
            <ExternalLink size={10} />
            Open Vibe Music
          </button>
        </div>

      </div>
    </div>
  );
};

export default SharePage;
