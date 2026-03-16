import { cn } from "@/lib/utils";

interface VinylRecordProps {
  isSpinning: boolean;
  emoji: string;
}

const VinylRecord = ({ isSpinning, emoji }: VinylRecordProps) => {
  return (
    <div className="relative w-48 h-48 mx-auto mt-0 mb-4">
      {/* Vinyl disc */}
      <div
        className={cn(
          "w-full h-full rounded-full relative",
          "bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-950",
          "shadow-[0_0_40px_rgba(0,0,0,0.6),inset_0_0_60px_rgba(0,0,0,0.4)]",
          "border-2 border-zinc-700/50",
          isSpinning ? "animate-spin-vinyl" : ""
        )}
        style={{ animationDuration: "3s" }}
      >
        {/* Grooves */}
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full border border-zinc-700/20"
            style={{
              inset: `${12 + i * 5}%`,
            }}
          />
        ))}
        {/* Center label */}
        <div className="absolute inset-[35%] rounded-full bg-gradient-to-br from-amber-800 to-amber-950 flex items-center justify-center shadow-inner border border-amber-700/50">
          <span className="text-2xl">{emoji}</span>
        </div>
        {/* Center hole */}
        <div className="absolute inset-[46%] rounded-full bg-zinc-950 shadow-inner" />
        {/* Shine */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-transparent via-white/5 to-transparent pointer-events-none" />
      </div>
    </div>
  );
};

export default VinylRecord;
