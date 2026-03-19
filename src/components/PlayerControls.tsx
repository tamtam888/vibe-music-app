import { Play, Pause, SkipBack, SkipForward, Volume2, Shuffle, Zap, Waves, Mic, MicOff, Sparkles, Loader2, ScanLine } from "lucide-react";
import { Slider } from "@/components/ui/slider";

interface PlayerControlsProps {
  theme: "dark" | "light";
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  shuffle: boolean;
  aiFlow: boolean;
  beatMatch: boolean;
  onTogglePlay: () => void;
  onToggleShuffle: () => void;
  onToggleAIFlow: () => void;
  onToggleBeatMatch: () => void;
  onNext: () => void;
  onPrev: () => void;
  onSeek: (time: number) => void;
  onVolumeChange: (v: number) => void;
  voiceSupported?: boolean;
  voiceStatus?: "idle" | "listening" | "processing" | "error";
  onVoiceTap?: () => void;
  canGenerate?: boolean;
  isGenerating?: boolean;
  onGenerate?: () => void;
  onOpenBPMScanner?: () => void;
}

function formatTime(s: number) {
  if (!s || isNaN(s)) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

const PlayerControls = ({
  theme,
  isPlaying,
  currentTime,
  duration,
  volume,
  shuffle,
  aiFlow,
  beatMatch,
  onTogglePlay,
  onToggleShuffle,
  onToggleAIFlow,
  onToggleBeatMatch,
  onNext,
  onPrev,
  onSeek,
  onVolumeChange,
  voiceSupported,
  voiceStatus,
  onVoiceTap,
  canGenerate,
  isGenerating,
  onGenerate,
  onOpenBPMScanner,
}: PlayerControlsProps) => {
  // Slider class strings must be literal so Tailwind JIT includes them.
  const seekBarClass = theme === "light"
    ? "flex-1 [&_[role=slider]]:bg-amber-800 [&_[role=slider]]:border-amber-900 [&_[role=slider]]:h-3 [&_[role=slider]]:w-3 [&_.relative]:bg-amber-800/20 [&_[data-orientation=horizontal]>.absolute]:bg-amber-800"
    : "flex-1 [&_[role=slider]]:bg-amber-500 [&_[role=slider]]:border-amber-600 [&_[role=slider]]:h-3 [&_[role=slider]]:w-3 [&_.relative]:bg-amber-950/50 [&_[data-orientation=horizontal]>.absolute]:bg-amber-600";

  const volumeClass = theme === "light"
    ? "w-[120px] [&_[role=slider]]:bg-amber-800 [&_[role=slider]]:border-amber-900 [&_[role=slider]]:h-2.5 [&_[role=slider]]:w-2.5 [&_.relative]:bg-amber-800/20 [&_[data-orientation=horizontal]>.absolute]:bg-amber-800/70"
    : "w-[120px] [&_[role=slider]]:bg-amber-500 [&_[role=slider]]:border-amber-600 [&_[role=slider]]:h-2.5 [&_[role=slider]]:w-2.5 [&_.relative]:bg-amber-950/50 [&_[data-orientation=horizontal]>.absolute]:bg-amber-600/70";

  const timeColor = theme === "light" ? "#7a4b16" : undefined;
  const volIconColor = theme === "light" ? "#7a4b16" : undefined;

  return (
    <div className="flex flex-col items-center gap-3 w-full">

      {/* Seek bar */}
      <div className="flex items-center gap-2 text-xs font-mono w-full px-2">
        <span
          className="w-10 text-right shrink-0 text-amber-300/70"
          style={{ color: timeColor }}
        >
          {formatTime(currentTime)}
        </span>
        <Slider
          value={[currentTime]}
          max={duration || 100}
          step={0.5}
          onValueChange={([v]) => onSeek(v)}
          className={seekBarClass}
        />
        <span
          className="w-10 shrink-0 text-amber-300/70"
          style={{ color: timeColor }}
        >
          {formatTime(duration)}
        </span>
      </div>

      {/* Transport controls — always LTR so prev/next icons stay consistent */}
      <div className="flex flex-col items-center gap-3" dir="ltr">
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={onPrev}
            className="p-2 rounded-full text-amber-400/80 hover:text-amber-300 hover:bg-amber-900/30 transition-all"
            aria-label="Previous track"
          >
            <SkipBack size={20} />
          </button>
          <button
            onClick={onTogglePlay}
            className="p-3 rounded-full bg-gradient-to-b from-amber-700 to-amber-900 text-amber-100 hover:from-amber-600 hover:to-amber-800 shadow-lg shadow-amber-950/50 transition-all active:scale-95 border border-amber-600/50"
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? <Pause size={24} /> : <Play size={24} className="ml-0.5" />}
          </button>
          <button
            onClick={onNext}
            className="p-2 rounded-full text-amber-400/80 hover:text-amber-300 hover:bg-amber-900/30 transition-all"
            aria-label="Next track"
          >
            <SkipForward size={20} />
          </button>
        </div>

        <div className="flex items-center justify-center gap-3">
          <button
            onClick={onToggleShuffle}
            className={`p-2 rounded-full transition-all ${shuffle ? "text-amber-200 bg-amber-800/50" : "text-amber-500/40 hover:text-amber-400 hover:bg-amber-900/30"}`}
            aria-label="Shuffle"
            aria-pressed={shuffle}
          >
            <Shuffle size={16} />
          </button>
          <button
            onClick={onToggleAIFlow}
            className={`p-2 rounded-full transition-all ${aiFlow ? "text-emerald-300 bg-emerald-800/50" : "text-amber-500/40 hover:text-amber-400 hover:bg-amber-900/30"}`}
            aria-label="AI Radio Mode"
            aria-pressed={aiFlow}
          >
            <Zap size={16} />
          </button>
          <button
            onClick={onToggleBeatMatch}
            className={`p-2 rounded-full transition-all ${beatMatch ? "text-purple-300 bg-purple-800/50" : "text-amber-500/40 hover:text-amber-400 hover:bg-amber-900/30"}`}
            aria-label={beatMatch ? "Beat Match Active" : "Beat Match"}
            aria-pressed={beatMatch}
            title="Beat Match — picks next track by closest BPM (metadata-based)"
          >
            <Waves size={16} />
          </button>
          {onOpenBPMScanner && (
            <button
              onClick={onOpenBPMScanner}
              className="p-2 rounded-full transition-all text-amber-500/40 hover:text-purple-300 hover:bg-purple-900/30"
              aria-label="BPM Scanner — find matching tracks from your files"
              title="BPM Scanner — scan your files and find songs at the same tempo"
            >
              <ScanLine size={16} />
            </button>
          )}
          {canGenerate && onGenerate && (
            <button
              onClick={onGenerate}
              disabled={isGenerating}
              className={`p-2 rounded-full transition-all ${
                isGenerating
                  ? "text-indigo-300 bg-indigo-800/50 cursor-wait"
                  : "text-amber-500/40 hover:text-indigo-300 hover:bg-indigo-900/30"
              }`}
              aria-label="Generate AI track"
              title="Generate an AI track in the current vibe"
            >
              {isGenerating ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
            </button>
          )}
          {voiceSupported && onVoiceTap && (
            <button
              onClick={onVoiceTap}
              disabled={voiceStatus === "processing"}
              className={`p-2 rounded-full transition-all relative ${
                voiceStatus === "listening"
                  ? "text-red-300 bg-red-800/50"
                  : voiceStatus === "error"
                    ? "text-red-500/40 hover:text-red-400 hover:bg-amber-900/30"
                    : "text-amber-500/40 hover:text-amber-400 hover:bg-amber-900/30"
              }`}
              aria-label={voiceStatus === "listening" ? "Stop listening" : "Voice control"}
              aria-pressed={voiceStatus === "listening"}
              title={
                voiceStatus === "error"
                  ? "Microphone permission denied"
                  : voiceStatus === "listening"
                    ? "Listening…"
                    : "Voice control"
              }
            >
              {voiceStatus === "listening" && (
                <span className="absolute inset-0 rounded-full animate-ping bg-red-500/20 pointer-events-none" />
              )}
              {voiceStatus === "error" ? <MicOff size={16} /> : <Mic size={16} />}
            </button>
          )}
        </div>
      </div>

      {/* Volume */}
      <div className="flex items-center justify-center gap-2">
        <Volume2
          size={14}
          className="text-amber-500/60 shrink-0"
          style={{ color: volIconColor }}
        />
        <Slider
          value={[volume * 100]}
          max={100}
          step={1}
          onValueChange={([v]) => onVolumeChange(v / 100)}
          className={volumeClass}
        />
      </div>

    </div>
  );
};

export default PlayerControls;
