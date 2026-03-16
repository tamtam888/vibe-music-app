import { Play, Pause, SkipBack, SkipForward, Volume2, Shuffle, Zap } from "lucide-react";
import { Slider } from "@/components/ui/slider";

interface PlayerControlsProps {
  theme: "dark" | "light";
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  shuffle: boolean;
  aiFlow: boolean;
  onTogglePlay: () => void;
  onToggleShuffle: () => void;
  onToggleAIFlow: () => void;
  onNext: () => void;
  onPrev: () => void;
  onSeek: (time: number) => void;
  onVolumeChange: (v: number) => void;
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
  onTogglePlay,
  onToggleShuffle,
  onToggleAIFlow,
  onNext,
  onPrev,
  onSeek,
  onVolumeChange,
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
    <div className="flex flex-col items-center gap-4 w-full">

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
