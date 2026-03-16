import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";
import { SpotifyProfile } from "@/hooks/useSpotifyConnection";
import { X, Loader2 } from "lucide-react";

interface SourceToggleProps {
  source: "mp3" | "spotify";
  onSourceChange: (source: "mp3" | "spotify") => void;
  spotifyProfile?: SpotifyProfile | null;
  spotifyConnecting?: boolean;
  onSpotifyConnect?: () => void;
  onSpotifyDisconnect?: () => void;
}

const SourceToggle = ({
  source,
  onSourceChange,
  spotifyProfile,
  spotifyConnecting,
  onSpotifyConnect,
  onSpotifyDisconnect,
}: SourceToggleProps) => {
  const { theme } = useTheme();

  const activeStyle = theme === "light"
    ? { color: "#3b2407", backgroundColor: "rgba(180,140,60,0.25)", borderColor: "rgba(146,100,30,0.5)" }
    : { color: "#fff3c4", backgroundColor: "rgba(146,64,14,0.6)", borderColor: "rgba(180,120,40,0.5)" };

  const inactiveStyle = theme === "light"
    ? { color: "#7a4b16", backgroundColor: "rgba(200,170,100,0.12)", borderColor: "rgba(146,100,30,0.25)" }
    : { color: "rgba(251,191,36,0.55)", backgroundColor: "rgba(30,20,10,0.3)", borderColor: "rgba(120,53,15,0.3)" };

  const spotifyActive = theme === "light"
    ? { color: "#15803d", backgroundColor: "rgba(22,163,74,0.18)", borderColor: "rgba(22,163,74,0.35)" }
    : { color: "#bbf7d0", backgroundColor: "rgba(22,101,52,0.6)", borderColor: "rgba(22,163,74,0.5)" };

  const isSpotifyOn = !!spotifyProfile || source === "spotify";

  return (
    <div className="flex items-center justify-center gap-1">
      <button
        onClick={() => onSourceChange("mp3")}
        className="px-3 py-1 rounded-l-lg text-[10px] font-bold uppercase tracking-wider transition-all border"
        style={source === "mp3" ? activeStyle : inactiveStyle}
      >
        MP3
      </button>
      <div className="relative">
        <button
          onClick={() => {
            if (spotifyConnecting) return;
            if (!spotifyProfile && onSpotifyConnect) {
              onSpotifyConnect();
            } else {
              onSourceChange("spotify");
            }
          }}
          className="px-3 py-1 rounded-r-lg text-[10px] font-bold uppercase tracking-wider transition-all border flex items-center gap-1"
          style={isSpotifyOn ? spotifyActive : inactiveStyle}
        >
          {spotifyConnecting ? (
            <Loader2 size={10} className="animate-spin" />
          ) : spotifyProfile?.profile_image ? (
            <img
              src={spotifyProfile.profile_image}
              alt=""
              className="w-3 h-3 rounded-full"
            />
          ) : null}
          {spotifyConnecting
            ? "Connecting..."
            : spotifyProfile
              ? spotifyProfile.display_name || "Spotify"
              : "Spotify"}
        </button>
        {spotifyProfile && onSpotifyDisconnect && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSpotifyDisconnect();
            }}
            className="absolute -top-1.5 -right-1.5 p-0.5 rounded-full bg-red-900/80 text-red-300 hover:bg-red-800 transition-colors border border-red-700/50"
            title="Disconnect Spotify"
          >
            <X size={8} />
          </button>
        )}
      </div>
    </div>
  );
};

export default SourceToggle;
