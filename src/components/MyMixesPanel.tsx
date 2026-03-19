import { SavedMix, getMixShareUrl } from "@/hooks/useSavedMixes";
import { useLanguage } from "@/contexts/LanguageContext";
import { Play, Trash2, Zap, Music, ListMusic, Share2, Check } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface MyMixesPanelProps {
  mixes: SavedMix[];
  loading: boolean;
  onPlayMix: (mix: SavedMix) => void;
  onDeleteMix: (mixId: string) => void;
  creatorName?: string;
}

const MyMixesPanel = ({ mixes, loading, onPlayMix, onDeleteMix, creatorName }: MyMixesPanelProps) => {
  const { t } = useLanguage();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleShare = (mix: SavedMix) => {
    const url = getMixShareUrl(mix, creatorName);
    navigator.clipboard.writeText(url).then(() => {
      setCopiedId(mix.id);
      toast.success("Share link copied! 🔗 Send it to anyone");
      setTimeout(() => setCopiedId(null), 2500);
    }).catch(() => {
      // Fallback: open in new tab
      window.open(url, "_blank");
    });
  };

  if (loading) {
    return (
      <div className="text-center py-4">
        <p className="text-[10px] text-amber-500/40 uppercase tracking-wider animate-pulse">
          {t("loading")}...
        </p>
      </div>
    );
  }

  if (mixes.length === 0) {
    return (
      <div className="text-center py-4">
        <ListMusic size={20} className="mx-auto text-amber-500/30 mb-2" />
        <p className="text-[10px] text-amber-500/40 uppercase tracking-wider">
          {t("noMixesYet")}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      {mixes.map((mix) => (
        <div
          key={mix.id}
          className="flex items-center gap-2 px-3 py-2 rounded-lg border border-amber-900/30 bg-amber-950/30 hover:bg-amber-900/20 transition-all group"
        >
          <div className="flex-shrink-0">
            {mix.mixType === "ai_flow" ? (
              <Zap size={14} className="text-emerald-500/70" />
            ) : (
              <Music size={14} className="text-amber-500/50" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-amber-300/80 truncate font-medium">{mix.name}</p>
            <p className="text-[9px] text-amber-500/40">
              {mix.tracks.length} {t("tracks").toLowerCase()} · {new Date(mix.createdAt).toLocaleDateString()}
            </p>
          </div>
          <button
            onClick={() => onPlayMix(mix)}
            className="p-1.5 rounded-md text-amber-400/60 hover:text-amber-200 hover:bg-amber-800/40 transition-colors"
            title={t("play")}
          >
            <Play size={12} />
          </button>
          <button
            onClick={() => handleShare(mix)}
            className={`p-1.5 rounded-md transition-colors ${
              copiedId === mix.id
                ? "text-emerald-400 bg-emerald-900/30"
                : "text-amber-500/30 hover:text-amber-300 hover:bg-amber-800/30 opacity-0 group-hover:opacity-100"
            }`}
            title="Share mix — copy link"
          >
            {copiedId === mix.id ? <Check size={12} /> : <Share2 size={12} />}
          </button>
          <button
            onClick={() => onDeleteMix(mix.id)}
            className="p-1.5 rounded-md text-amber-500/30 hover:text-red-400 hover:bg-red-900/20 transition-colors opacity-0 group-hover:opacity-100"
            title={t("deleteMix")}
          >
            <Trash2 size={12} />
          </button>
        </div>
      ))}
    </div>
  );
};

export default MyMixesPanel;
