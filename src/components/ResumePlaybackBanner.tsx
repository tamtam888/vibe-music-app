import { useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { ResumeData } from "@/hooks/useResumePlayback";
import { Play, X } from "lucide-react";

interface ResumePlaybackBannerProps {
  resumeData: ResumeData;
  onResume: () => void;
  onDismiss: () => void;
}

const AUTO_DISMISS_MS = 6000;

const ResumePlaybackBanner = ({ resumeData, onResume, onDismiss }: ResumePlaybackBannerProps) => {
  const { t } = useLanguage();
  const minutes = Math.floor(resumeData.positionSeconds / 60);
  const seconds = Math.floor(resumeData.positionSeconds % 60);

  // Auto-dismiss after a short window so it doesn't linger on screen.
  useEffect(() => {
    const timer = setTimeout(onDismiss, AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-[260px]">
      <div
        className="rounded-xl px-2.5 py-2 flex items-center gap-2.5"
        style={{
          background: "var(--vibe-card-bg)",
          border: "1px solid var(--vibe-card-border)",
          boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
        }}
      >
        <button
          onClick={onResume}
          className="flex-shrink-0 p-1.5 rounded-full transition-opacity hover:opacity-80"
          style={{
            background: "var(--vibe-card-border)",
            color: "var(--vibe-title-from)",
          }}
          aria-label={t("resumeLastTrack")}
        >
          <Play size={12} />
        </button>

        <div className="flex-1 min-w-0">
          <p
            className="text-[9px] uppercase tracking-wider"
            style={{ color: "var(--vibe-title-from)", opacity: 0.65 }}
          >
            {t("resumeLastTrack")}
          </p>
          <p
            className="text-xs truncate font-medium"
            style={{ color: "var(--vibe-title-from)" }}
          >
            {resumeData.track.title}
          </p>
          <p
            className="text-[9px]"
            style={{ color: "var(--vibe-title-from)", opacity: 0.5 }}
          >
            {minutes}:{seconds.toString().padStart(2, "0")} · {resumeData.track.artist}
          </p>
        </div>

        <button
          onClick={onDismiss}
          className="flex-shrink-0 p-1 transition-opacity hover:opacity-80"
          style={{ color: "var(--vibe-title-from)", opacity: 0.45 }}
          aria-label={t("done")}
        >
          <X size={12} />
        </button>
      </div>
    </div>
  );
};

export default ResumePlaybackBanner;
