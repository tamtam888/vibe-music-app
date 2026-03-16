import { useLanguage } from "@/contexts/LanguageContext";
import { Upload, Settings, Zap, Music2 } from "lucide-react";

interface EmptyLibraryStateProps {
  onEditLibrary: () => void;
  onEnableAIFlow: () => void;
}

const EmptyLibraryState = ({ onEditLibrary, onEnableAIFlow }: EmptyLibraryStateProps) => {
  const { t } = useLanguage();

  return (
    <div className="text-center py-8 px-4">
      <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-amber-900/30 border border-amber-700/30 mb-4">
        <Music2 size={24} className="text-amber-500/60" />
      </div>

      <h3 className="text-sm font-semibold text-amber-200/80 mb-1">{t("emptyStateTitle")}</h3>
      <p className="text-[10px] text-amber-500/50 uppercase tracking-wider mb-5">{t("emptyStateSubtitle")}</p>

      <div className="space-y-2.5 mb-6 text-left max-w-[220px] mx-auto">
        {[
          { num: "1", text: t("emptyStep1"), icon: Upload },
          { num: "2", text: t("emptyStep2"), icon: Settings },
          { num: "3", text: t("emptyStep3"), icon: Zap },
        ].map((step) => (
          <div key={step.num} className="flex items-start gap-2.5">
            <span className="flex-shrink-0 w-5 h-5 rounded-full bg-amber-800/40 border border-amber-700/30 flex items-center justify-center text-[9px] font-bold text-amber-400/80">
              {step.num}
            </span>
            <p className="text-xs text-amber-300/60 leading-tight pt-0.5">{step.text}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-center gap-2 flex-wrap">
        <button
          onClick={onEditLibrary}
          className="px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all border bg-amber-900/40 border-amber-700/40 text-amber-400 hover:bg-amber-800/50 hover:text-amber-200 flex items-center gap-1.5"
        >
          <Upload size={10} />
          {t("uploadMusic")}
        </button>
        <button
          onClick={onEditLibrary}
          className="px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all border bg-amber-900/40 border-amber-700/40 text-amber-400 hover:bg-amber-800/50 hover:text-amber-200 flex items-center gap-1.5"
        >
          <Settings size={10} />
          {t("editLibrary")}
        </button>
        <button
          onClick={onEnableAIFlow}
          className="px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all border bg-emerald-900/40 border-emerald-700/40 text-emerald-400 hover:bg-emerald-800/50 hover:text-emerald-200 flex items-center gap-1.5"
        >
          <Zap size={10} />
          {t("tryAiFlow")}
        </button>
      </div>
    </div>
  );
};

export default EmptyLibraryState;
