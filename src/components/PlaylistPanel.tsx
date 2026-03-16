import { Playlist, Track } from "@/data/playlists";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import { Music, Heart } from "lucide-react";

interface PlaylistPanelProps {
  vibes: Playlist[];
  activePlaylist: Playlist | null;
  currentTrack: Track | null;
  isPlaying: boolean;
  onSelectPlaylist: (playlist: Playlist) => void;
  onSelectTrack: (playlist: Playlist, index: number) => void;
  isFavorite?: (trackId: string) => boolean;
  onToggleFavorite?: (track: Track) => void;
}

const PlaylistPanel = ({
  vibes,
  activePlaylist,
  currentTrack,
  isPlaying,
  onSelectPlaylist,
  onSelectTrack,
  isFavorite,
  onToggleFavorite,
}: PlaylistPanelProps) => {
  const { t } = useLanguage();
  return (
    <div className="space-y-4">
      {/* Playlist chips */}
      <div className="grid grid-cols-3 gap-2">
        {vibes.map((pl) => (
          <button
            key={pl.id}
            onClick={() => onSelectPlaylist(pl)}
            className={cn(
              "flex flex-col items-center gap-1 p-3 rounded-xl transition-all text-center",
              "border border-amber-900/30 hover:border-amber-700/50",
              "hover:bg-amber-900/20 active:scale-95",
              activePlaylist?.id === pl.id
                ? "bg-amber-900/40 border-amber-600/50 shadow-inner"
                : "bg-amber-950/30"
            )}
          >
            <span className="text-xl">{pl.emoji}</span>
            <span className="text-[10px] font-semibold text-amber-300/80 uppercase tracking-wider leading-tight">
              {pl.name}
            </span>
          </button>
        ))}
      </div>

      {/* Track list */}
      {activePlaylist && (
        <div className="space-y-1">
          <h3 className="text-xs uppercase tracking-widest text-amber-500/50 font-bold px-1 mb-2">
            {activePlaylist.emoji} {activePlaylist.name}
          </h3>
          {activePlaylist.tracks.length === 0 && (
            <p className="text-xs text-amber-500/40 text-center py-4">
              {t("addMp3sInEditLibrary")}
            </p>
          )}
          {activePlaylist.tracks.map((track, i) => {
            const isActive = currentTrack?.id === track.id;
            const fav = isFavorite?.(track.id);
            return (
              <button
                key={track.id}
                onClick={() => onSelectTrack(activePlaylist, i)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-left",
                  "hover:bg-amber-800/20",
                  isActive
                    ? "bg-amber-800/30 border border-amber-700/40"
                    : "border border-transparent"
                )}
              >
                <div className={cn(
                  "w-7 h-7 rounded-full flex items-center justify-center text-xs flex-shrink-0",
                  isActive && isPlaying
                    ? "bg-amber-600 text-amber-100 animate-pulse"
                    : "bg-amber-900/50 text-amber-400/70"
                )}>
                  {isActive && isPlaying ? (
                    <Music size={12} />
                  ) : (
                    <span className="font-mono">{i + 1}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn(
                    "text-sm truncate",
                    isActive ? "text-amber-200 font-medium" : "text-amber-300/70"
                  )}>
                    {track.title}
                  </p>
                  <p className="text-[10px] text-amber-500/40 truncate">{track.artist}</p>
                </div>
                {onToggleFavorite && (
                  <span
                    role="button"
                    onClick={(e) => { e.stopPropagation(); onToggleFavorite(track); }}
                    className="p-1 flex-shrink-0"
                  >
                    <Heart
                      size={12}
                      className={cn(
                        "transition-colors",
                        fav ? "text-red-400 fill-red-400" : "text-amber-500/20 hover:text-red-400/60"
                      )}
                    />
                  </span>
                )}
                <span className="text-[10px] text-amber-500/30 font-mono">{track.duration}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PlaylistPanel;
