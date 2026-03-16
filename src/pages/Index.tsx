import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAudioPlayer } from "@/hooks/useAudioPlayer";
import { Playlist, Track } from "@/data/playlists";
import { useVibeLibrary } from "@/hooks/useVibeLibrary";
import { useAIFlow, AIFlowQueueItem } from "@/hooks/useAIFlow";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useCloudSync } from "@/hooks/useCloudSync";
import { useSavedMixes, SavedMix } from "@/hooks/useSavedMixes";
import { useFavorites } from "@/hooks/useFavorites";
import { useRecentlyPlayed } from "@/hooks/useRecentlyPlayed";
import { useResumePlayback } from "@/hooks/useResumePlayback";
import { useSpotifyConnection } from "@/hooks/useSpotifyConnection";
import VinylRecord from "@/components/VinylRecord";
import PlayerControls from "@/components/PlayerControls";
import PlaylistPanel from "@/components/PlaylistPanel";
import VibeCreatorModal from "@/components/VibeCreatorModal";
import SourceToggle from "@/components/SourceToggle";
import ResumeBanner from "@/components/ResumeBanner";
import BatteryTip from "@/components/BatteryTip";
import EmptyLibraryState from "@/components/EmptyLibraryState";
import SaveMixDialog from "@/components/SaveMixDialog";
import MyMixesPanel from "@/components/MyMixesPanel";
import RecentlyPlayedPanel from "@/components/RecentlyPlayedPanel";
import ResumePlaybackBanner from "@/components/ResumePlaybackBanner";
import AuthControls from "@/components/AuthControls";
import { Disc3, Settings, User, LogOut, Cloud, HardDrive, Save, ListMusic, Clock, Heart } from "lucide-react";

const Index = () => {
  const player = useAudioPlayer();
  const library = useVibeLibrary();
  const { buildNextTrack, resetFlow } = useAIFlow();
  const { user, signOut } = useAuth();
  const { t, lang, setLang } = useLanguage();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();

  // ── UI state ────────────────────────────────────────────────────────────────
  const [activePlaylist, setActivePlaylist] = useState<Playlist | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [source, setSource] = useState<"mp3" | "spotify">("mp3");
  const [aiFlowEnabled, setAiFlowEnabled] = useState(false);
  const [currentBridge, setCurrentBridge] = useState<AIFlowQueueItem | null>(null);
  const [saveMixOpen, setSaveMixOpen] = useState(false);
  const [showMyMixes, setShowMyMixes] = useState(false);
  const [showRecents, setShowRecents] = useState(false);
  const [playedTracks, setPlayedTracks] = useState<Track[]>([]);

  // ── Data hooks ───────────────────────────────────────────────────────────────
  const savedMixes = useSavedMixes(user);
  const favorites = useFavorites(user);
  const recents = useRecentlyPlayed(user);
  const resume = useResumePlayback(user);
  const spotify = useSpotifyConnection(user);

  // ── Theme-aware colour tokens ────────────────────────────────────────────────
  const isDark = theme === "dark";
  const discIconColor   = isDark ? "#d97706"               : "#92400e";
  const subtitleColor   = isDark ? "rgba(212,160,86,0.52)" : "rgba(91,58,20,0.52)";
  const cloudSyncColor  = isDark ? "rgba(251,191,36,0.5)"  : "rgba(91,58,20,0.6)";
  const localOnlyColor  = isDark ? "rgba(251,191,36,0.3)"  : "rgba(91,58,20,0.4)";

  // ── Cloud sync ───────────────────────────────────────────────────────────────
  useCloudSync({
    user,
    vibes: library.vibes,
    setVibes: library.setVibes,
    shuffle: player.shuffle,
    aiFlow: aiFlowEnabled,
    language: lang,
    theme,
  });

  // Listen for cloud settings loaded via custom event
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail.language && (detail.language === "en" || detail.language === "he")) {
        setLang(detail.language);
      }
      if (typeof detail.aiFlow === "boolean") {
        setAiFlowEnabled(detail.aiFlow);
      }
      if (detail.theme && (detail.theme === "dark" || detail.theme === "light")) {
        setTheme(detail.theme);
      }
    };
    window.addEventListener("vibe-cloud-settings", handler);
    return () => window.removeEventListener("vibe-cloud-settings", handler);
  }, [setLang]);

  // ── Playback handlers ────────────────────────────────────────────────────────
  const handleSelectPlaylist = useCallback(
    (pl: Playlist) => {
      setActivePlaylist(pl);
      setCurrentBridge(null);
      resetFlow();
      player.startPlaylist(pl.tracks, 0);
    },
    [player, resetFlow]
  );

  const handleSelectTrack = useCallback(
    (pl: Playlist, index: number) => {
      setActivePlaylist(pl);
      setCurrentBridge(null);
      resetFlow();
      player.startPlaylist(pl.tracks, index);
    },
    [player, resetFlow]
  );

  const handleAIFlowNext = useCallback(() => {
    if (!aiFlowEnabled || !player.currentTrack) {
      setCurrentBridge(null);
      player.playNext();
      return;
    }
    const result = buildNextTrack(player.currentTrack, library.vibes, playedTracks);
    if (result) {
      setCurrentBridge(result);
      const ownerVibe = library.vibes.find((v) =>
        v.tracks.some((t) => t.id === result.track.id)
      );
      if (ownerVibe) setActivePlaylist(ownerVibe);
      player.startPlaylist([result.track], 0);
    } else {
      setCurrentBridge(null);
      player.playNext();
    }
  }, [aiFlowEnabled, player, buildNextTrack, library.vibes, playedTracks]);

  // Wire AI Radio override into the audio player's track-ended handler
  useEffect(() => {
    player.onTrackEndedOverrideRef.current = aiFlowEnabled ? handleAIFlowNext : null;
  }, [aiFlowEnabled, handleAIFlowNext]);

  const effectiveNext = aiFlowEnabled ? handleAIFlowNext : player.playNext;

  // Track played songs for Save Mix + Recently Played + Resume State
  useEffect(() => {
    if (player.currentTrack) {
      setPlayedTracks((prev) => {
        if (prev.length > 0 && prev[prev.length - 1].id === player.currentTrack!.id) return prev;
        return [...prev, player.currentTrack!];
      });
      recents.addRecent(player.currentTrack);
      resume.clearResume();
    }
  }, [player.currentTrack]);

  // Save resume state periodically while playing
  useEffect(() => {
    if (!player.isPlaying || !player.currentTrack) return;
    const interval = setInterval(() => {
      if (player.currentTrack && player.currentTime > 0) {
        resume.saveResumeState(player.currentTrack, player.currentTime, player.playlist);
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [player.isPlaying, player.currentTrack, player.currentTime]);

  const handlePlayMix = useCallback((mix: SavedMix) => {
    if (mix.tracks.length === 0) return;
    setPlayedTracks([]);
    setActivePlaylist(null);
    setCurrentBridge(null);
    player.startPlaylist(mix.tracks, 0);
    setShowMyMixes(false);
  }, [player]);

  const handlePlayRecentTrack = useCallback((track: Track) => {
    setActivePlaylist(null);
    setCurrentBridge(null);
    player.startPlaylist([track], 0);
  }, [player]);

  const handleResumePlayback = useCallback(() => {
    if (!resume.resumeData) return;
    const { track, positionSeconds, playlist } = resume.resumeData;
    if (playlist && playlist.length > 0) {
      const idx = playlist.findIndex((t) => t.id === track.id);
      player.startPlaylist(playlist, idx >= 0 ? idx : 0);
    } else {
      player.startPlaylist([track], 0);
    }
    setTimeout(() => {
      if (positionSeconds > 0) player.seek(positionSeconds);
    }, 500);
    resume.clearResume();
  }, [resume.resumeData, player]);

  // Determine which bottom tab is active
  const activeTab = showRecents ? "recents" : showMyMixes ? "mixes" : "vibes";

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 transition-colors duration-300"
      dir={lang === "he" ? "rtl" : "ltr"}
      style={{
        background: `linear-gradient(to bottom, var(--vibe-page-from), var(--vibe-page-via), var(--vibe-page-to))`,
      }}
    >
      {/* Fixed top-right: language + theme controls (matches auth page) */}
      <AuthControls />

      <div className="w-full max-w-md mx-auto">

        {/* ── Branding header ─────────────────────────────────────────────────── */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 mb-1">
            <Disc3 style={{ color: discIconColor }} size={20} />
            <h1
              className="text-2xl font-bold tracking-[0.3em] uppercase"
              style={{
                background: `linear-gradient(180deg, var(--vibe-title-from), var(--vibe-title-to))`,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              {t("vibeMusic")}
            </h1>
            <Disc3 style={{ color: discIconColor }} size={20} />
          </div>
          <p
            className="text-[10px] uppercase tracking-[0.5em] font-medium"
            style={{ color: subtitleColor }}
          >
            {t("vintageVibePlayer")}
          </p>
        </div>

        {/* ── Status bar: user + storage mode ─────────────────────────────────── */}
        <div className="flex items-center justify-between mb-3 px-1">
          {/* Left: user status */}
          <div className="flex items-center gap-1.5">
            {user ? (
              <>
                <span
                  className="text-[9px] flex items-center gap-1"
                  style={{ color: cloudSyncColor }}
                >
                  <Cloud size={10} className="text-emerald-500/70" />
                  {t("cloudSynced")}
                </span>
                <button
                  onClick={signOut}
                  className="p-1 text-amber-500/40 hover:text-amber-400 transition-colors"
                  title={t("signOut")}
                >
                  <LogOut size={12} />
                </button>
              </>
            ) : (
              <button
                onClick={() => navigate("/auth")}
                className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all border bg-amber-900/40 border-amber-700/40 text-amber-400 hover:bg-amber-800/50 hover:text-amber-200"
              >
                <User size={10} />
                {t("continueWithEmail")}
              </button>
            )}
          </div>
          {/* Right: storage mode indicator */}
          {!user && (
            <span
              className="text-[9px] flex items-center gap-1"
              style={{ color: localOnlyColor }}
            >
              <HardDrive size={10} />
              {t("localOnly")}
            </span>
          )}
        </div>

        {/* ── Main player card ─────────────────────────────────────────────────── */}
        <div
          className="rounded-3xl p-6 shadow-2xl transition-colors duration-300 relative overflow-hidden"
          style={{
            background: "var(--vibe-card-bg)",
            boxShadow: "var(--vibe-card-shadow)",
            border: `1px solid var(--vibe-card-border)`,
          }}
        >
          {/* Grain texture — correctly contained inside the card */}
          <div
            className="absolute inset-0 opacity-[0.03] pointer-events-none z-0"
            style={{
              backgroundImage:
                `repeating-linear-gradient(90deg, transparent, transparent 2px, var(--vibe-grain-color) 2px, var(--vibe-grain-color) 4px)`,
            }}
            aria-hidden="true"
          />

          {/* Card content sits above the grain */}
          <div className="relative z-10">

            {/* ── Visual: vinyl record ────────────────────────────────────────── */}
            <VinylRecord
              isSpinning={player.isPlaying}
              emoji={activePlaylist?.emoji || "🎵"}
            />

            {/* ── AI Radio status badge ────────────────────────────────────────── */}
            {aiFlowEnabled && player.currentTrack && (
              <div className="text-center mb-1">
                <span className="inline-block px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest bg-emerald-900/40 text-emerald-400/90 border border-emerald-700/30">
                  {t("aiFlowActive")}
                </span>
                {currentBridge?.isBridge && (
                  <p className="text-[9px] text-emerald-500/60 mt-0.5 tracking-wider">
                    {t("bridgeClassical")}
                  </p>
                )}
              </div>
            )}

            {/* ── Now playing: title + artist + favourite ──────────────────────── */}
            {player.allFailed ? (
              <div className="text-center mb-4 px-4 py-3 rounded-lg bg-red-950/30 border border-red-900/30">
                <p className="text-red-300 font-semibold text-sm">{t("playbackError")}</p>
                <p className="text-red-400/60 text-xs">{t("tryAnotherVibe")}</p>
              </div>
            ) : player.currentTrack ? (
              <div className="text-center mb-4 flex items-center justify-center gap-2">
                <div className="min-w-0">
                  <p className="text-amber-200 font-semibold text-sm truncate">
                    {player.currentTrack.title}
                  </p>
                  <p className="text-amber-500/50 text-xs truncate">
                    {player.currentTrack.artist}
                  </p>
                </div>
                <button
                  onClick={() => favorites.toggleFavorite(player.currentTrack!)}
                  className="flex-shrink-0 p-1"
                  aria-label={t("favorites")}
                >
                  <Heart
                    size={14}
                    className={
                      favorites.isFavorite(player.currentTrack.id)
                        ? "text-red-400 fill-red-400 transition-colors"
                        : "text-amber-500/30 hover:text-red-400/60 transition-colors"
                    }
                  />
                </button>
              </div>
            ) : null}

            {/* ── Playback controls ────────────────────────────────────────────── */}
            <PlayerControls
              theme={theme}
              isPlaying={player.isPlaying}
              currentTime={player.currentTime}
              duration={player.duration}
              volume={player.volume}
              shuffle={player.shuffle}
              aiFlow={aiFlowEnabled}
              onTogglePlay={player.togglePlay}
              onToggleShuffle={player.toggleShuffle}
              onToggleAIFlow={() => {
                setAiFlowEnabled((v) => !v);
                if (!aiFlowEnabled) resetFlow();
                setCurrentBridge(null);
              }}
              onNext={effectiveNext}
              onPrev={player.playPrev}
              onSeek={player.seek}
              onVolumeChange={player.changeVolume}
            />

            <div className="my-5 h-px bg-gradient-to-r from-transparent via-amber-800/30 to-transparent" />

            {/* ── Source controls + Edit Library ───────────────────────────────── */}
            <div className="flex items-center justify-center gap-3 mb-3">
              <SourceToggle
                source={source}
                onSourceChange={setSource}
                spotifyProfile={spotify.profile}
                spotifyConnecting={spotify.connecting}
                onSpotifyConnect={() => {
                  if (!user) { navigate("/auth"); return; }
                  spotify.connect();
                }}
                onSpotifyDisconnect={spotify.disconnect}
              />
              <BatteryTip />
              <button
                onClick={() => setEditorOpen(true)}
                className="px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all border bg-amber-900/40 border-amber-700/40 text-amber-400 hover:bg-amber-800/50 hover:text-amber-200 flex items-center gap-1"
              >
                <Settings size={10} />
                {t("editLibrary")}
              </button>
            </div>

            {/* ── Save Mix (appears once 2+ tracks played) ─────────────────────── */}
            {player.currentTrack && playedTracks.length >= 2 && (
              <div className="flex items-center justify-center mb-3">
                <button
                  onClick={() => {
                    if (!user) { navigate("/auth"); return; }
                    setSaveMixOpen(true);
                  }}
                  className="px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all border bg-emerald-900/40 border-emerald-700/40 text-emerald-400 hover:bg-emerald-800/50 hover:text-emerald-200 flex items-center gap-1"
                >
                  <Save size={10} />
                  {t("saveMix")} ({playedTracks.length})
                </button>
              </div>
            )}

            {/* ── Tab bar: Vibes / Recents / My Mixes ─────────────────────────── */}
            <div className="flex items-center justify-center gap-4 mb-3">
              <button
                onClick={() => { setShowMyMixes(false); setShowRecents(false); }}
                className={`text-[10px] font-bold uppercase tracking-wider pb-1 border-b-2 transition-colors ${
                  activeTab === "vibes"
                    ? "text-amber-300/80 border-amber-500/60"
                    : "text-amber-500/40 border-transparent hover:text-amber-400/60"
                }`}
              >
                {t("tracks")}
              </button>
              <button
                onClick={() => { setShowRecents(true); setShowMyMixes(false); }}
                className={`text-[10px] font-bold uppercase tracking-wider pb-1 border-b-2 transition-colors flex items-center gap-1 ${
                  activeTab === "recents"
                    ? "text-amber-300/80 border-amber-500/60"
                    : "text-amber-500/40 border-transparent hover:text-amber-400/60"
                }`}
              >
                <Clock size={10} />
                {t("recentlyPlayed")}
              </button>
              {user && savedMixes.mixes.length > 0 && (
                <button
                  onClick={() => { setShowMyMixes(true); setShowRecents(false); }}
                  className={`text-[10px] font-bold uppercase tracking-wider pb-1 border-b-2 transition-colors flex items-center gap-1 ${
                    activeTab === "mixes"
                      ? "text-amber-300/80 border-amber-500/60"
                      : "text-amber-500/40 border-transparent hover:text-amber-400/60"
                  }`}
                >
                  <ListMusic size={10} />
                  {t("myMixes")}
                </button>
              )}
            </div>

            {/* ── Content panels ───────────────────────────────────────────────── */}
            {activeTab === "recents" ? (
              <RecentlyPlayedPanel
                recents={recents.recents}
                onPlayTrack={handlePlayRecentTrack}
                isFavorite={favorites.isFavorite}
                onToggleFavorite={favorites.toggleFavorite}
              />
            ) : activeTab === "mixes" && user ? (
              <MyMixesPanel
                mixes={savedMixes.mixes}
                loading={savedMixes.loading}
                onPlayMix={handlePlayMix}
                onDeleteMix={savedMixes.deleteMix}
              />
            ) : source === "spotify" ? (
              <div className="text-center py-6">
                {spotify.profile ? (
                  <>
                    <div className="flex items-center justify-center gap-2 mb-2">
                      {spotify.profile.profile_image && (
                        <img src={spotify.profile.profile_image} alt="" className="w-8 h-8 rounded-full" />
                      )}
                      <div>
                        <p className="text-green-300 text-sm font-semibold">{spotify.profile.display_name}</p>
                        <p className="text-green-500/50 text-[10px]">{t("spotifyConnected")}</p>
                      </div>
                    </div>
                    <p className="text-amber-500/40 text-[10px] mt-2">{t("comingSoon")}</p>
                  </>
                ) : (
                  <>
                    <p className="text-amber-500/50 text-xs uppercase tracking-wider">{t("spotifyNotConnected")}</p>
                    <button
                      onClick={() => {
                        if (!user) { navigate("/auth"); return; }
                        spotify.connect();
                      }}
                      className="mt-2 px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all border bg-green-900/40 border-green-700/40 text-green-400 hover:bg-green-800/50 hover:text-green-200"
                    >
                      {t("connectSpotify")}
                    </button>
                  </>
                )}
              </div>
            ) : library.vibes.every((v) => v.tracks.length === 0) ? (
              <EmptyLibraryState
                onEditLibrary={() => setEditorOpen(true)}
                onEnableAIFlow={() => {
                  setAiFlowEnabled(true);
                  resetFlow();
                  setCurrentBridge(null);
                }}
              />
            ) : (
              <PlaylistPanel
                vibes={library.vibes}
                activePlaylist={activePlaylist}
                currentTrack={player.currentTrack}
                isPlaying={player.isPlaying}
                onSelectPlaylist={handleSelectPlaylist}
                onSelectTrack={handleSelectTrack}
                isFavorite={favorites.isFavorite}
                onToggleFavorite={favorites.toggleFavorite}
              />
            )}
          </div>{/* end relative z-10 */}
        </div>{/* end card */}

        {/* ── Footer ──────────────────────────────────────────────────────────── */}
        <p
          className="text-center text-[9px] mt-4 tracking-widest uppercase"
          style={{ color: localOnlyColor }}
        >
          {t("craftedWithWarmth")}
        </p>

      </div>{/* end max-w-md */}

      {/* ── Floating banners ────────────────────────────────────────────────── */}
      {player.needsResume && (
        <ResumeBanner
          onResume={player.togglePlay}
          onDismiss={player.dismissResume}
        />
      )}

      {!player.currentTrack && resume.resumeData && (
        <ResumePlaybackBanner
          resumeData={resume.resumeData}
          onResume={handleResumePlayback}
          onDismiss={resume.clearResume}
        />
      )}

      {/* ── Modals ──────────────────────────────────────────────────────────── */}
      <VibeCreatorModal
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        vibes={library.vibes}
        onUpdateVibe={library.updateVibe}
        onAddTrack={library.addTrackToVibe}
        onRemoveTrack={library.removeTrackFromVibe}
        onMoveTrack={library.moveTrack}
        onReset={library.resetToDefaults}
        onAddCustomVibe={library.addCustomVibe}
        onRemoveCustomVibe={library.removeCustomVibe}
      />

      <SaveMixDialog
        open={saveMixOpen}
        onClose={() => setSaveMixOpen(false)}
        onSave={(name) => {
          savedMixes.saveMix(name, playedTracks, aiFlowEnabled ? "ai_flow" : "manual");
          setPlayedTracks([]);
        }}
        mixType={aiFlowEnabled ? "ai_flow" : "manual"}
        trackCount={playedTracks.length}
      />
    </div>
  );
};

export default Index;
