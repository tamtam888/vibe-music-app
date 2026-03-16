import { useState, useRef, useCallback, useEffect } from "react";
import { Track } from "@/data/playlists";

function generateShuffleOrder(length: number): number[] {
  const order = Array.from({ length }, (_, i) => i);
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return order;
}

// Singleton persistent audio element – never recreated
let _persistentAudio: HTMLAudioElement | null = null;
function getPersistentAudio(): HTMLAudioElement {
  if (!_persistentAudio) {
    _persistentAudio = new Audio();
    _persistentAudio.setAttribute("playsinline", "true");
    _persistentAudio.preload = "auto";
  }
  return _persistentAudio;
}

function updateMediaSession(track: Track | null, handlers: {
  play: () => void; pause: () => void; next: () => void; prev: () => void;
}) {
  if (!("mediaSession" in navigator)) return;
  if (track) {
    navigator.mediaSession.metadata = new MediaMetadata({
      title: track.title,
      artist: track.artist,
      album: "VIBE Music",
    });
  }
  navigator.mediaSession.setActionHandler("play", handlers.play);
  navigator.mediaSession.setActionHandler("pause", handlers.pause);
  navigator.mediaSession.setActionHandler("nexttrack", handlers.next);
  navigator.mediaSession.setActionHandler("previoustrack", handlers.prev);
}

function setMediaSessionState(state: "playing" | "paused" | "none") {
  if ("mediaSession" in navigator) {
    navigator.mediaSession.playbackState = state;
  }
}

export function useAudioPlayer() {
  const audioRef = useRef<HTMLAudioElement>(getPersistentAudio());
  const onTrackEndedOverrideRef = useRef<(() => void) | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [playlist, setPlaylist] = useState<Track[]>([]);
  const [trackIndex, setTrackIndex] = useState(0);
  const [allFailed, setAllFailed] = useState(false);
  const [shuffle, setShuffle] = useState(false);
  const [shuffleOrder, setShuffleOrder] = useState<number[]>([]);
  const [needsResume, setNeedsResume] = useState(false);
  const failCountRef = useRef(0);
  const shuffleRef = useRef(false);
  const shuffleOrderRef = useRef<number[]>([]);

  // Refs to hold current values for the audio event handlers
  const playlistRef = useRef<Track[]>([]);
  const trackIndexRef = useRef(0);
  const isPlayingRef = useRef(false);

  // Keep refs in sync with state
  useEffect(() => { playlistRef.current = playlist; }, [playlist]);
  useEffect(() => { trackIndexRef.current = trackIndex; }, [trackIndex]);
  useEffect(() => { isPlayingRef.current = isPlaying; }, [isPlaying]);
  useEffect(() => { shuffleRef.current = shuffle; }, [shuffle]);
  useEffect(() => { shuffleOrderRef.current = shuffleOrder; }, [shuffleOrder]);

  const loadAndPlay = useCallback((track: Track) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
    audio.src = track.url;
    audio.load();
    audio.play().then(() => {
      setIsPlaying(true);
      setAllFailed(false);
      setNeedsResume(false);
      failCountRef.current = 0;
      setMediaSessionState("playing");
    }).catch(() => {
      console.warn("Playback failed for", track.title);
    });
    setCurrentTrack(track);
  }, []);

  const getNextIndex = useCallback((currentIdx: number, tracks: Track[], direction: 1 | -1 = 1): number => {
    if (shuffleRef.current && shuffleOrderRef.current.length === tracks.length) {
      const posInOrder = shuffleOrderRef.current.indexOf(currentIdx);
      const nextPos = (posInOrder + direction + tracks.length) % tracks.length;
      return shuffleOrderRef.current[nextPos];
    }
    return (currentIdx + direction + tracks.length) % tracks.length;
  }, []);

  const handleTrackEnded = useCallback(() => {
    // If an external override is set (e.g. AI Radio), use it
    if (onTrackEndedOverrideRef.current) {
      onTrackEndedOverrideRef.current();
      return;
    }
    const tracks = playlistRef.current;
    if (tracks.length === 0) return;
    const nextIndex = getNextIndex(trackIndexRef.current, tracks, 1);
    setTrackIndex(nextIndex);
    trackIndexRef.current = nextIndex;
    setAllFailed(false);
    failCountRef.current = 0;
    loadAndPlay(tracks[nextIndex]);
  }, [loadAndPlay, getNextIndex]);

  const handleError = useCallback(() => {
    console.warn("Track failed to load, skipping...");
    const tracks = playlistRef.current;
    failCountRef.current += 1;
    if (failCountRef.current >= tracks.length && tracks.length > 0) {
      setAllFailed(true);
      setIsPlaying(false);
      return;
    }
    handleTrackEnded();
  }, [handleTrackEnded]);

  useEffect(() => {
    const audio = audioRef.current;
    audio.volume = volume;

    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onLoadedMetadata = () => setDuration(audio.duration);

    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("ended", handleTrackEnded);
    audio.addEventListener("error", handleError);

    return () => {
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("ended", handleTrackEnded);
      audio.removeEventListener("error", handleError);
      // Do NOT pause or clear src – keep audio alive across re-renders
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handleTrackEnded, handleError]);

  const startPlaylist = useCallback((tracks: Track[], index = 0) => {
    setPlaylist(tracks);
    setTrackIndex(index);
    playlistRef.current = tracks;
    trackIndexRef.current = index;
    if (shuffleRef.current) {
      const order = generateShuffleOrder(tracks.length);
      setShuffleOrder(order);
      shuffleOrderRef.current = order;
    }
    loadAndPlay(tracks[index]);
  }, [loadAndPlay]);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
      setMediaSessionState("paused");
    } else {
      audio.play().then(() => {
        setIsPlaying(true);
        setNeedsResume(false);
        setMediaSessionState("playing");
      }).catch(() => {});
    }
  }, [isPlaying, currentTrack]);

  const playNext = useCallback(() => {
    handleTrackEnded();
  }, [handleTrackEnded]);

  const playPrev = useCallback(() => {
    const tracks = playlistRef.current;
    if (tracks.length === 0) return;
    const prevIndex = getNextIndex(trackIndexRef.current, tracks, -1);
    setTrackIndex(prevIndex);
    trackIndexRef.current = prevIndex;
    loadAndPlay(tracks[prevIndex]);
  }, [loadAndPlay, getNextIndex]);

  const toggleShuffle = useCallback(() => {
    setShuffle((prev) => {
      const next = !prev;
      if (next) {
        const order = generateShuffleOrder(playlistRef.current.length);
        setShuffleOrder(order);
        shuffleOrderRef.current = order;
      }
      return next;
    });
  }, []);

  const seek = useCallback((time: number) => {
    const audio = audioRef.current;
    if (audio) audio.currentTime = time;
  }, []);

  const changeVolume = useCallback((v: number) => {
    setVolume(v);
    if (audioRef.current) audioRef.current.volume = v;
  }, []);

  const dismissResume = useCallback(() => setNeedsResume(false), []);

  // Media Session registration
  useEffect(() => {
    if (!currentTrack) return;
    updateMediaSession(currentTrack, {
      play: () => {
        audioRef.current.play().then(() => {
          setIsPlaying(true);
          setNeedsResume(false);
          setMediaSessionState("playing");
        }).catch(() => {});
      },
      pause: () => {
        audioRef.current.pause();
        setIsPlaying(false);
        setMediaSessionState("paused");
      },
      next: () => handleTrackEnded(),
      prev: () => {
        const tracks = playlistRef.current;
        if (tracks.length === 0) return;
        const prevIndex = getNextIndex(trackIndexRef.current, tracks, -1);
        setTrackIndex(prevIndex);
        trackIndexRef.current = prevIndex;
        loadAndPlay(tracks[prevIndex]);
      },
    });
  }, [currentTrack, handleTrackEnded, getNextIndex, loadAndPlay]);

  // Resume detection: if we were playing and come back to find audio paused
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "visible" && isPlayingRef.current) {
        const audio = audioRef.current;
        if (audio && audio.paused && audio.src) {
          setIsPlaying(false);
          setNeedsResume(true);
          setMediaSessionState("paused");
        }
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

  return {
    isPlaying,
    currentTrack,
    currentTime,
    duration,
    volume,
    playlist,
    trackIndex,
    allFailed,
    shuffle,
    needsResume,
    onTrackEndedOverrideRef,
    togglePlay,
    toggleShuffle,
    startPlaylist,
    playNext,
    playPrev,
    seek,
    changeVolume,
    dismissResume,
  };
}
