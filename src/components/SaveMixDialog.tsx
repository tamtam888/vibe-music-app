import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Save } from "lucide-react";

interface SaveMixDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (name: string) => void;
  mixType: "ai_flow" | "manual";
  trackCount: number;
}

const SaveMixDialog = ({ open, onClose, onSave, mixType, trackCount }: SaveMixDialogProps) => {
  const { t } = useLanguage();
  const [name, setName] = useState("");

  const handleSave = () => {
    if (!name.trim()) return;
    onSave(name.trim());
    setName("");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="bg-amber-950/95 border-amber-800/50 text-amber-200 max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-amber-200 text-sm uppercase tracking-widest flex items-center gap-2">
            <Save size={14} />
            {t("saveMix")}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="text-[10px] uppercase tracking-wider text-amber-500/60 block mb-1">
              {t("mixName")}
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={mixType === "ai_flow" ? "AI Radio Mix" : "My Mix"}
              className="w-full px-3 py-2 rounded-lg bg-amber-900/40 border border-amber-700/40 text-amber-200 text-sm placeholder:text-amber-500/30 focus:outline-none focus:border-amber-600/60"
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
              autoFocus
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-amber-500/40">
              {trackCount} {t("tracks").toLowerCase()} · {mixType === "ai_flow" ? t("aiFlow") : t("manualMix")}
            </span>
            <button
              onClick={handleSave}
              disabled={!name.trim()}
              className="px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all border bg-amber-800/60 border-amber-600/50 text-amber-200 hover:bg-amber-700/60 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {t("save")}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SaveMixDialog;
