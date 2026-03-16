import { Play, X } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface ResumeBannerProps {
  onResume: () => void;
  onDismiss: () => void;
}

const ResumeBanner = ({ onResume, onDismiss }: ResumeBannerProps) => {
  const { t } = useLanguage();
  return (
    <div
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-3 py-2 rounded-xl backdrop-blur-sm"
      style={{
        background: "var(--vibe-card-bg)",
        border: "1px solid var(--vibe-card-border)",
        boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
      }}
    >
      <button
        onClick={onResume}
        className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider transition-opacity hover:opacity-80"
        style={{ color: "var(--vibe-title-from)" }}
      >
        <Play size={13} className="ml-0.5" />
        {t("tapToResume")}
      </button>
      <button
        onClick={onDismiss}
        className="p-0.5 transition-opacity hover:opacity-80"
        style={{ color: "var(--vibe-title-from)", opacity: 0.45 }}
        aria-label={t("done")}
      >
        <X size={13} />
      </button>
    </div>
  );
};

export default ResumeBanner;
