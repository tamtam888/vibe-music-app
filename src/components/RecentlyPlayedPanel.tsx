import { RecentTrack } from "@/hooks/useRecentlyPlayed";
import { Track } from "@/data/playlists";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import { Clock, Play, Heart } from "lucide-react";

interface RecentlyPlayedPanelProps {
  recents: RecentTrack[];
  onPlayTrack: (track: Track) => void;
  isFavorite: (trackId: string) => boolean;
  onToggleFavorite: (track: Track) => void;
}

const RecentlyPlayedPanel = ({ recents, onPlayTrack, isFavorite, onToggleFavorite }: RecentlyPlayedPanelProps) => {
  const { t } = useLanguage();

  if (recents.length === 0) {
    return (
      <div className="text-center py-4">
        <Clock size={20} className="mx-auto text-amber-500/30 mb-2" />
        <p className="text-[10px] text-amber-500/40 uppercase tracking-wider">
          {t("noRecentTracks")}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {recents.slice(0, 10).map((track) => {
        const fav = isFavorite(track.id);
        return (
          <div
            key={`${track.id}-${track.playedAt}`}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-transparent hover:bg-amber-800/20 transition-all group"
          >
            <button
              onClick={() => onPlayTrack(track)}
              className="p-1.5 rounded-md text-amber-400/60 hover:text-amber-200 hover:bg-amber-800/40 transition-colors"
            >
              <Play size={12} />
            </button>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-amber-300/70 truncate">{track.title}</p>
              <p className="text-[9px] text-amber-500/40 truncate">{track.artist}</p>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); onToggleFavorite(track); }}
              className="p-1 transition-colors"
            >
              <Heart
                size={12}
                className={cn(
                  "transition-colors",
                  fav ? "text-red-400 fill-red-400" : "text-amber-500/30 hover:text-red-400/60"
                )}
              />
            </button>
            <span className="text-[9px] text-amber-500/30 font-mono">{track.duration}</span>
          </div>
        );
      })}
    </div>
  );
};

export default RecentlyPlayedPanel;
