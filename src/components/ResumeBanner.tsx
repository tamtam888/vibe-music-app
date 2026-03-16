import { Play, X } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface ResumeBannerProps {
  onResume: () => void;
  onDismiss: () => void;
}

const ResumeBanner = ({ onResume, onDismiss }: ResumeBannerProps) => {
  const { t } = useLanguage();
  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-900/90 border border-amber-700/50 shadow-md backdrop-blur-sm">
      <button
        onClick={onResume}
        className="flex items-center gap-1.5 text-amber-200 text-xs font-semibold uppercase tracking-wider hover:text-amber-100 transition-colors"
      >
        <Play size={14} className="ml-0.5" />
        {t("tapToResume")}
      </button>
      <button
        onClick={onDismiss}
        className="p-0.5 text-amber-500/60 hover:text-amber-300 transition-colors"
        aria-label={t("done")}
      >
        <X size={14} />
      </button>
    </div>
  );
};

export default ResumeBanner;
