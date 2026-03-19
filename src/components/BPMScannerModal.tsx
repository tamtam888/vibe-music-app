import { useState, useCallback, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Track, Playlist } from "@/data/playlists";
import { detectBPMFromFile, bpmMatchScore, BPMResult } from "@/hooks/useBPMDetector";
import { generateTrackId } from "@/hooks/useVibeLibrary";
import { Loader2, Music, Plus, CheckCircle2, FolderOpen, Zap } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface BPMScannerModalProps {
  open: boolean;
  onClose: () => void;
  currentTrackBPM?: number | null;
  vibes: Playlist[];
  onAddTrack: (vibeId: string, track: Track) => void;
}

type ScanState = "idle" | "scanning" | "done";

interface ScannedFile extends BPMResult {
  added: boolean;
  matchScore: number;
}

const BPMScannerModal = ({
  open,
  onClose,
  currentTrackBPM,
  vibes,
  onAddTrack,
}: BPMScannerModalProps) => {
  const [scanState, setScanState] = useState<ScanState>("idle");
  const [scanned, setScanned] = useState<ScannedFile[]>([]);
  const [progress, setProgress] = useState(0);
  const [total, setTotal] = useState(0);
  const [selectedVibe, setSelectedVibe] = useState<string>(vibes[0]?.id ?? "");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef(false);

  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      const audioFiles = Array.from(files).filter((f) =>
        /\.(mp3|wav|ogg|m4a|flac|aac)$/i.test(f.name)
      );
      if (audioFiles.length === 0) {
        toast.error("No audio files found. Supported: mp3, wav, ogg, m4a, flac, aac");
        return;
      }

      abortRef.current = false;
      setScanState("scanning");
      setScanned([]);
      setProgress(0);
      setTotal(audioFiles.length);

      const results: ScannedFile[] = [];

      for (let i = 0; i < audioFiles.length; i++) {
        if (abortRef.current) break;
        const result = await detectBPMFromFile(audioFiles[i]);
        const score = currentTrackBPM && result.bpm
          ? bpmMatchScore(currentTrackBPM, result.bpm)
          : 0;
        results.push({ ...result, added: false, matchScore: score });
        // Sort: matches first, then by score desc
        results.sort((a, b) => b.matchScore - a.matchScore);
        setScanned([...results]);
        setProgress(i + 1);
      }

      setScanState("done");
    },
    [currentTrackBPM]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  const handleAddTrack = useCallback(
    (item: ScannedFile) => {
      if (!selectedVibe) return;
      const track: Track = {
        id: generateTrackId(),
        title: item.name,
        artist: "Local File",
        duration: "?",
        url: item.objectUrl,
        bpm: item.bpm ?? undefined,
        source: "mp3",
      };
      onAddTrack(selectedVibe, track);
      setScanned((prev) =>
        prev.map((s) => (s.objectUrl === item.objectUrl ? { ...s, added: true } : s))
      );
      const vibe = vibes.find((v) => v.id === selectedVibe);
      toast.success(`Added "${item.name}" to ${vibe?.emoji ?? ""} ${vibe?.name ?? "vibe"}`);
    },
    [selectedVibe, vibes, onAddTrack]
  );

  const matchLabel = (score: number) => {
    if (score === 100) return { text: "Perfect match", color: "text-emerald-400" };
    if (score >= 85)  return { text: "Great match",   color: "text-emerald-500/70" };
    if (score >= 65)  return { text: "Good match",    color: "text-amber-400/80" };
    if (score >= 40)  return { text: "Loose match",   color: "text-amber-500/50" };
    return { text: "Different tempo", color: "text-zinc-500" };
  };

  const matchBadgeColor = (score: number) => {
    if (score === 100) return "bg-emerald-900/50 border-emerald-600/40 text-emerald-300";
    if (score >= 85)  return "bg-emerald-900/30 border-emerald-700/30 text-emerald-400/80";
    if (score >= 65)  return "bg-amber-900/40 border-amber-700/30 text-amber-300/80";
    if (score >= 40)  return "bg-amber-900/20 border-amber-800/20 text-amber-500/60";
    return "bg-zinc-900/30 border-zinc-700/20 text-zinc-500";
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="bg-zinc-900 border-zinc-700 text-amber-100 max-w-lg max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-amber-300">
            <Zap size={16} className="text-purple-400" />
            BPM Scanner
            {currentTrackBPM && (
              <span className="text-xs font-normal text-purple-300/70 ml-1">
                · matching {currentTrackBPM} BPM
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        {/* Vibe selector */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-zinc-400 shrink-0">Add to:</span>
          <select
            value={selectedVibe}
            onChange={(e) => setSelectedVibe(e.target.value)}
            className="bg-zinc-800 border border-zinc-600 rounded px-2 py-1 text-amber-200 text-xs flex-1"
          >
            {vibes.map((v) => (
              <option key={v.id} value={v.id}>
                {v.emoji} {v.name}
              </option>
            ))}
          </select>
        </div>

        {/* Drop zone */}
        {scanState === "idle" && (
          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-zinc-600 hover:border-purple-500/60 rounded-xl p-8 text-center cursor-pointer transition-colors group"
          >
            <FolderOpen size={32} className="mx-auto mb-3 text-zinc-500 group-hover:text-purple-400 transition-colors" />
            <p className="text-sm font-medium text-zinc-300">Drop audio files here</p>
            <p className="text-xs text-zinc-500 mt-1">or click to select — mp3, wav, ogg, m4a, flac</p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".mp3,.wav,.ogg,.m4a,.flac,.aac"
              multiple
              className="hidden"
              onChange={(e) => e.target.files && handleFiles(e.target.files)}
            />
          </div>
        )}

        {/* Progress */}
        {scanState === "scanning" && (
          <div className="text-center py-4">
            <Loader2 size={24} className="animate-spin mx-auto mb-2 text-purple-400" />
            <p className="text-sm text-zinc-300">
              Analysing {progress} / {total} files…
            </p>
            <div className="mt-3 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-purple-500 transition-all duration-300"
                style={{ width: `${(progress / total) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Results */}
        {scanned.length > 0 && (
          <div className="flex-1 overflow-y-auto space-y-1.5 mt-1 pr-1">
            {scanned.map((item) => {
              const label = matchLabel(item.matchScore);
              return (
                <div
                  key={item.objectUrl}
                  className={cn(
                    "flex items-center gap-2 p-2.5 rounded-lg border transition-colors",
                    item.matchScore >= 65
                      ? "bg-zinc-800/80 border-zinc-700/60"
                      : "bg-zinc-900/40 border-zinc-800/30"
                  )}
                >
                  <Music size={12} className="text-zinc-500 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-amber-200 truncate">{item.name}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {item.bpm ? (
                        <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded border", matchBadgeColor(item.matchScore))}>
                          {item.bpm} BPM
                        </span>
                      ) : (
                        <span className="text-[10px] text-zinc-600">BPM unknown</span>
                      )}
                      {item.bpm && currentTrackBPM && (
                        <span className={cn("text-[10px]", label.color)}>{label.text}</span>
                      )}
                    </div>
                  </div>
                  {item.added ? (
                    <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                  ) : (
                    <button
                      onClick={() => handleAddTrack(item)}
                      className="p-1 rounded bg-amber-800/50 hover:bg-amber-700/60 text-amber-300 transition-colors shrink-0"
                      title="Add to vibe"
                    >
                      <Plus size={12} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-zinc-800">
          {scanState === "done" ? (
            <span className="text-xs text-zinc-500">
              {scanned.filter((s) => s.bpm).length} / {scanned.length} files analysed
            </span>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            {scanState !== "idle" && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { setScanState("idle"); setScanned([]); abortRef.current = true; }}
                className="text-zinc-400 hover:text-zinc-200 text-xs"
              >
                Scan Again
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-zinc-400 hover:text-zinc-200 text-xs"
            >
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BPMScannerModal;
