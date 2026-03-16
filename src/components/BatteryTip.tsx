import { useState, useEffect } from "react";
import { Info, X } from "lucide-react";

const BatteryTip = () => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => setOpen(false), 4000);
    return () => clearTimeout(timer);
  }, [open]);

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="p-1 text-amber-600/40 hover:text-amber-500 transition-colors"
        title="Background playback tip"
      >
        <Info size={12} />
      </button>
      {open && (
        <div
          className="fixed top-4 right-4 max-w-xs w-80 p-3 rounded-lg shadow-xl z-50 text-[10px] leading-relaxed"
          style={{
            backgroundColor: "rgba(45, 30, 10, 0.97)",
            color: "#fff3c4",
            border: "1px solid rgba(120, 80, 20, 0.4)",
          }}
        >
          <button
            onClick={() => setOpen(false)}
            className="absolute top-1.5 right-1.5 transition-colors"
            style={{ color: "rgba(255,243,196,0.5)" }}
          >
            <X size={10} />
          </button>
          <p className="font-semibold mb-1 text-[11px]" style={{ color: "#fbbf24" }}>
            Background Playback
          </p>
          <p>
            If playback stops when your screen locks on Android, disable Battery
            Optimization for your browser (Chrome) and for VIBE Music (if installed
            to home screen) in your device Settings → Apps → Battery.
          </p>
        </div>
      )}
    </div>
  );
};

export default BatteryTip;
