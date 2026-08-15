"use client";

import {
  createContext,
  useContext,
  useState,
  useRef,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import type { Track } from "@/lib/music";
import { DEFAULT_MUSIC } from "@/lib/music";

export type PlayMode = "sequential" | "loop" | "shuffle";

const STORAGE_KEY = "devlog-music-state";

interface PersistedState {
  currentTrack: number;
  volume: number;
  playMode: PlayMode;
  currentTime: number;
}

function loadPersisted(): Partial<PersistedState> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Partial<PersistedState>;
  } catch {
    return {};
  }
}

function savePersisted(state: Partial<PersistedState>) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {}
}

interface MusicState {
  tracks: Track[];
  currentTrack: number;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  isLoaded: boolean;
  hasError: boolean;
  volume: number;
  playMode: PlayMode;
  vinylAngle: number;
  frequencyBands: number[];
}

interface MusicActions {
  play: () => void;
  pause: () => void;
  toggle: () => void;
  next: () => void;
  prev: () => void;
  seek: (ratio: number) => void;
  setTrack: (index: number) => void;
  setVolume: (v: number) => void;
  setPlayMode: (mode: PlayMode) => void;
  cyclePlayMode: () => void;
}

interface MusicContextValue extends MusicState, MusicActions {
  audioRef: React.RefObject<HTMLAudioElement | null>;
}

const MusicContext = createContext<MusicContextValue | null>(null);

function shuffleArray<T>(arr: T[]): number[] {
  const indices = arr.map((_, i) => i);
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  return indices;
}

export function MusicProvider({ children }: { children: ReactNode }) {
  const persisted = loadPersisted();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [currentTrack, setCurrentTrack] = useState(persisted.currentTrack ?? 0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [volume, setVolumeState] = useState(persisted.volume ?? 0.7);
  const [playMode, setPlayModeState] = useState<PlayMode>(persisted.playMode ?? "sequential");
  const [vinylAngle, setVinylAngle] = useState(0);
  const [frequencyBands, setFrequencyBands] = useState<number[]>(new Array(16).fill(0));
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const shuffleOrderRef = useRef<number[]>([]);
  const lastTimeRef = useRef(0);
  const rafRef = useRef<number>(0);

  // Merged RAF loop: vinyl rotation + frequency visualization
  const frameCountRef = useRef(0);
  useEffect(() => {
    if (!isPlaying) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      return;
    }
    lastTimeRef.current = performance.now();
    frameCountRef.current = 0;

    const tick = (now: number) => {
      const delta = (now - lastTimeRef.current) / 1000;
      lastTimeRef.current = now;
      
      // Vinyl angle: update every frame (smooth)
      setVinylAngle((prev) => (prev + delta * 180) % 360);
      
      // Frequency bands: throttle to every 3 frames
      frameCountRef.current++;
      if (frameCountRef.current % 3 === 0 && analyserRef.current) {
        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(dataArray);
        const bands: number[] = [];
        const binsPerBand = Math.floor(dataArray.length / 16);
        for (let i = 0; i < 16; i++) {
          let sum = 0;
          for (let j = 0; j < binsPerBand; j++) {
            sum += dataArray[i * binsPerBand + j];
          }
          bands.push(Math.min(1, sum / (binsPerBand * 255)));
        }
        setFrequencyBands(bands);
      }
      
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [isPlaying]);

  // Sync vinyl angle when seeking (pause)
  useEffect(() => {
    if (!isPlaying && duration > 0) {
      setVinylAngle((currentTime * 180) % 360);
    }
  }, [currentTime, isPlaying, duration]);

  // AnalyserNode setup (one-time, on load)
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !isLoaded) return;
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === "suspended") ctx.resume();
      if (!analyserRef.current) {
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 64;
        analyser.smoothingTimeConstant = 0.85;
        const source = ctx.createMediaElementSource(audio);
        source.connect(analyser);
        analyser.connect(ctx.destination);
        analyserRef.current = analyser;
      }
    } catch {
      // Silently fail
    }
  }, [isLoaded, currentTrack]);

  // Load tracks from API
  useEffect(() => {
    const api = process.env.NEXT_PUBLIC_API_URL || "/api";
    fetch(api + "/music")
      .then((r) => r.json())
      .then((data) => {
        if (data && data.length > 0) {
          const mapped = data.map((t: any) => ({
            title: t.title,
            artist: t.artist,
            src: t.url,
          }));
          setTracks(mapped);
          // Clamp persisted track index to actual count
          if (persisted.currentTrack && persisted.currentTrack >= mapped.length) {
            setCurrentTrack(0);
          }
        } else {
          setTracks(DEFAULT_MUSIC.tracks);
        }
      })
      .catch(() => {
        setTracks(DEFAULT_MUSIC.tracks);
      });
  }, []);

  // Regenerate shuffle order when tracks change
  useEffect(() => {
    if (tracks.length > 1) {
      shuffleOrderRef.current = shuffleArray(tracks);
    }
  }, [tracks]);

  const track = tracks[currentTrack] || DEFAULT_MUSIC.tracks[0];

  // Audio event listeners
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onLoaded = () => {
      setDuration(audio.duration);
      setIsLoaded(true);
      setHasError(false);
    };
    const onTimeUpdate = () => {
      const t = audio.currentTime;
      setCurrentTime(t);
      // Throttled persist
      if (Math.abs(t - lastTimeRef.current) > 5) {
        lastTimeRef.current = t;
        savePersisted({ currentTrack, volume, playMode, currentTime: t });
      }
    };
    const onEnded = () => {
      if (tracks.length <= 1) {
        if (playMode === "loop") {
          audio.currentTime = 0;
          audio.play().catch(() => {});
        } else {
          setIsPlaying(false);
        }
        return;
      }
      if (playMode === "loop") {
        setCurrentTrack((p) => (p + 1) % tracks.length);
      } else if (playMode === "shuffle") {
        const currentShuffleIdx = shuffleOrderRef.current.findIndex((i) => i === currentTrack);
        if (currentShuffleIdx >= 0 && currentShuffleIdx < shuffleOrderRef.current.length - 1) {
          setCurrentTrack(shuffleOrderRef.current[currentShuffleIdx + 1]);
        } else {
          shuffleOrderRef.current = shuffleArray(tracks);
          setCurrentTrack(shuffleOrderRef.current[0]);
        }
      } else {
        if (currentTrack < tracks.length - 1) {
          setCurrentTrack((p) => p + 1);
        } else {
          setIsPlaying(false);
          audio.currentTime = 0;
        }
      }
    };
    const onError = () => {
      setHasError(true);
      setIsPlaying(false);
    };

    audio.addEventListener("loadedmetadata", onLoaded);
    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("error", onError);
    return () => {
      audio.removeEventListener("loadedmetadata", onLoaded);
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("error", onError);
    };
  }, [currentTrack, tracks, playMode]);

  // Reload audio when track changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    setIsLoaded(false);
    setHasError(false);
    setCurrentTime(0);
    audio.load();
    if (isPlaying) audio.play().catch(() => {});
  }, [currentTrack]);

  // Persist currentTrack on change
  useEffect(() => {
    if (tracks.length > 0) {
      savePersisted({ currentTrack, volume, playMode, currentTime: 0 });
    }
  }, [currentTrack, tracks.length]);

  // Persist volume on change
  useEffect(() => {
    savePersisted({ currentTrack, volume, playMode, currentTime });
  }, [volume]);

  // Persist playMode on change
  useEffect(() => {
    savePersisted({ currentTrack, volume, playMode, currentTime });
  }, [playMode]);

  // Sync volume to audio element
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  // Restore currentTime after track loads
  useEffect(() => {
    if (isLoaded && persisted.currentTime && persisted.currentTime > 0) {
      const audio = audioRef.current;
      if (audio && audio.duration > 0) {
        const targetTime = Math.min(persisted.currentTime, audio.duration - 1);
        audio.currentTime = targetTime;
      }
    }
  }, [isLoaded]);

  // Cleanup AudioContext on unmount
  useEffect(() => {
    return () => {
      if (audioCtxRef.current && audioCtxRef.current.state !== "closed") {
        audioCtxRef.current.close().catch(() => {});
      }
    };
  }, []);

  const play = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !isLoaded) return;
    audio.play().then(() => setIsPlaying(true)).catch(() => {});
  }, [isLoaded]);

  const pause = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
    setIsPlaying(false);
  }, []);

  const toggle = useCallback(() => {
    if (isPlaying) pause();
    else play();
  }, [isPlaying, play, pause]);

  const next = useCallback(() => {
    if (tracks.length <= 1) return;
    setCurrentTrack((p) => (p + 1) % tracks.length);
  }, [tracks.length]);

  const prev = useCallback(() => {
    if (tracks.length <= 1) return;
    const audio = audioRef.current;
    if (audio && audio.currentTime > 3) {
      audio.currentTime = 0;
      return;
    }
    setCurrentTrack((p) => (p - 1 + tracks.length) % tracks.length);
  }, [tracks.length]);

  const seek = useCallback(
    (ratio: number) => {
      const audio = audioRef.current;
      if (audio && isLoaded) {
        const targetTime = Math.max(0, Math.min(ratio, 1)) * duration;
        audio.currentTime = targetTime;
        // Save after seek
        savePersisted({ currentTrack, volume, playMode, currentTime: targetTime });
      }
    },
    [isLoaded, duration, currentTrack, volume, playMode]
  );

  const setTrack = useCallback(
    (index: number) => {
      if (index >= 0 && index < tracks.length) {
        setCurrentTrack(index);
      }
    },
    [tracks.length]
  );

  const setVolume = useCallback((v: number) => {
    const clamped = Math.max(0, Math.min(1, v));
    setVolumeState(clamped);
  }, []);

  const setPlayMode = useCallback((mode: PlayMode) => {
    setPlayModeState(mode);
  }, []);

  const cyclePlayMode = useCallback(() => {
    setPlayModeState((prev) => {
      if (prev === "sequential") return "loop";
      if (prev === "loop") return "shuffle";
      return "sequential";
    });
  }, []);

  const value: MusicContextValue = {
    tracks,
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    isLoaded,
    hasError,
    volume,
    playMode,
    vinylAngle,
    frequencyBands,
    audioRef,
    play,
    pause,
    toggle,
    next,
    prev,
    seek,
    setTrack,
    setVolume,
    setPlayMode,
    cyclePlayMode,
  };

  return (
    <MusicContext.Provider value={value}>
      <audio ref={audioRef} preload="none">
        <source src={track.src} type="audio/mpeg" />
      </audio>
      {children}
    </MusicContext.Provider>
  );
}

export function useMusic(): MusicContextValue {
  const ctx = useContext(MusicContext);
  if (!ctx) {
    throw new Error("useMusic must be used within a MusicProvider");
  }
  return ctx;
}
