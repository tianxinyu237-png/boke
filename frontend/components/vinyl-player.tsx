"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence, useMotionValue } from "motion/react";
import {
  Play, Pause, SkipForward, SkipBack, MusicNote, X,
  SpeakerHigh, SpeakerLow, SpeakerX, Repeat, Shuffle, List,
} from "@phosphor-icons/react";
import { useMusic } from "@/components/music-context";

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

const MODE_LABELS: Record<string, string> = {
  sequential: "顺序播放",
  loop: "列表循环",
  shuffle: "随机播放",
};

const MODE_NEXT: Record<string, string> = {
  sequential: "loop",
  loop: "shuffle",
  shuffle: "sequential",
};

export default function VinylPlayer() {
  const music = useMusic();
  const [isOpen, setIsOpen] = useState(false);
  const [volumeExpanded, setVolumeExpanded] = useState(false);
  const [playlistOpen, setPlaylistOpen] = useState(false);
  const {
    tracks,
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    isLoaded,
    hasError,
    volume,
    playMode,
    toggle,
    next,
    prev,
    seek,
    setTrack,
    setVolume,
    setPlayMode,
  } = music;

  const track = tracks[currentTrack] || { title: "暂无歌曲", artist: "", src: "" };

  const x = useMotionValue(typeof window !== "undefined" ? window.innerWidth - 72 : 0);
  const y = useMotionValue(typeof window !== "undefined" ? window.innerHeight - 180 : 0);
  const dragConstraints = useRef<HTMLDivElement>(null);

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  function VolumeIcon() {
    if (volume === 0) return <SpeakerX className="w-3 h-3" />;
    if (volume < 0.5) return <SpeakerLow className="w-3 h-3" />;
    return <SpeakerHigh className="w-3 h-3" />;
  }

  return (
    <div ref={dragConstraints} className="fixed inset-0 pointer-events-none z-50">
      {/* Collapsed state */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            drag
            dragMomentum={false}
            dragElastic={0.1}
            style={{ x, y, position: "absolute" }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={() => setIsOpen(true)}
            title={isPlaying ? `正在播放: ${track.title} - ${track.artist}` : "音乐播放器"}
            className="pointer-events-auto w-12 h-12 rounded-full flex items-center justify-center
              bg-white/[0.06] backdrop-blur-xl border border-white/[0.08]
              shadow-lg shadow-black/20 hover:bg-white/[0.10] hover:scale-105
              transition-colors cursor-grab active:cursor-grabbing group"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            aria-label="打开音乐播放器"
          >
            {/* Custom tooltip on hover */}
            {isPlaying && (
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 rounded-lg
                bg-[#111318]/95 backdrop-blur-xl border border-white/[0.08] text-[10px] text-text-secondary
                whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity
                pointer-events-none shadow-lg">
                {track.title} · {track.artist}
              </div>
            )}
            {isPlaying ? (
              <div className="relative">
                <motion.div
                  className="w-5 h-5 rounded-full"
                  style={{
                    background: "conic-gradient(#c084fc, #7DCDE8, #f093fb, #c084fc)",
                    transform: `rotate(${music.vinylAngle}deg)`,
                  }}
                />
                <div className="absolute inset-[30%] rounded-full bg-[#111]" />
              </div>
            ) : (
              <MusicNote weight="fill" className="w-5 h-5 text-text-secondary" />
            )}
            {isPlaying && (
              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-accent animate-pulse" />
            )}
          </motion.button>
        )}
      </AnimatePresence>

      {/* Expanded state */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            drag
            dragMomentum={false}
            dragElastic={0.1}
            style={{ x, y, position: "absolute" }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="pointer-events-auto"
          >
            <div className="relative bg-[#111318]/95 backdrop-blur-2xl rounded-2xl border border-white/[0.06] shadow-2xl shadow-black/40 overflow-hidden w-[260px] max-w-[calc(100vw-32px)]">

              {/* Top bar: mode + playlist + close */}
              <div className="absolute top-3 left-3 right-3 z-20 flex items-center justify-between">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setPlayMode(MODE_NEXT[playMode] as "sequential" | "loop" | "shuffle");
                  }}
                  className="w-7 h-7 rounded-full flex items-center justify-center
                    bg-white/5 hover:bg-white/10 text-text-muted hover:text-accent transition-colors"
                  title={MODE_LABELS[playMode]}
                  aria-label={MODE_LABELS[playMode]}
                >
                  {playMode === "shuffle" ? (
                    <Shuffle className="w-3 h-3" />
                  ) : playMode === "loop" ? (
                    <Repeat className="w-3 h-3" />
                  ) : (
                    <span className="text-[9px] font-bold">&#8645;</span>
                  )}
                </button>
                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => { e.stopPropagation(); setPlaylistOpen(true); }}
                    className="w-7 h-7 rounded-full flex items-center justify-center
                      bg-white/5 hover:bg-white/10 text-text-muted hover:text-accent transition-colors"
                    title="播放列表"
                    aria-label="播放列表"
                  >
                    <List className="w-3 h-3" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setIsOpen(false); }}
                    className="w-7 h-7 rounded-full flex items-center justify-center
                      bg-white/5 hover:bg-white/10 text-text-muted hover:text-text-primary transition-colors"
                    aria-label="关闭"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Turntable */}
              <div className="flex flex-col items-center pt-6 pb-4 px-4">
                <div className="relative w-[180px] h-[180px]">
                  <div className="absolute inset-0 rounded-full" style={{
                    background: "radial-gradient(circle at 50% 45%, #1a1a1a 0%, #0d0d0d 60%, #050505 100%)",
                    boxShadow: "inset 0 2px 16px rgba(0,0,0,0.6)",
                  }}>
                    <motion.div
                      className="absolute inset-[6%] rounded-full"
                      style={{
                        transform: `rotate(${music.vinylAngle}deg)`,

                        background: "conic-gradient(from 0deg, #1a1a1a 0deg, #0f0f0f 2deg, #1a1a1a 4deg, #111 6deg, #1a1a1a 8deg, #0f0f0f 10deg, #1a1a1a 12deg, #111 14deg, #1a1a1a 16deg, #0f0f0f 18deg, #1a1a1a 20deg)",
                        boxShadow: "0 2px 16px rgba(0,0,0,0.3)",
                      }}
                    >
                      <div className="absolute inset-[3%] rounded-full border border-white/[0.015]" />
                      <div className="absolute inset-[8%] rounded-full border border-white/[0.015]" />
                      <div className="absolute inset-[16%] rounded-full border border-white/[0.01]" />
                      <div className="absolute inset-[26%] rounded-full border border-white/[0.01]" />
                      <div className="absolute inset-[38%] rounded-full border border-white/[0.008]" />
                      <div className="absolute inset-[28%] rounded-full flex flex-col items-center justify-center" style={{
                        background: "linear-gradient(135deg, #c084fc 0%, #7DCDE8 50%, #f093fb 100%)",
                        boxShadow: "0 0 16px rgba(192,132,252,0.25), inset 0 1px 0 rgba(255,255,255,0.15)",
                      }}>
                        <span className="text-[7px] font-bold text-white/85 tracking-wider text-center leading-tight">LIGHT<br />MUSIC</span>
                      </div>
                      <div className="absolute inset-[44%] rounded-full bg-[#0a0a0a] border border-white/[0.06] flex items-center justify-center">
                        <div className="w-[25%] h-[25%] rounded-full bg-[#1a1a1a]" />
                      </div>
                    </motion.div>
                  </div>
                  <div className="absolute top-[16px] right-[10px] w-[11px] h-[11px] rounded-full z-10" style={{
                    background: "radial-gradient(circle at 40% 35%, #777 0%, #444 40%, #222 100%)",
                    boxShadow: "0 1px 4px rgba(0,0,0,0.3)",
                  }} />
                  <motion.div
                    className="absolute z-10"
                    style={{ top: "22px", right: "16px", width: "70px", height: "3px",
                      transformOrigin: "100% 0%",
                      background: "linear-gradient(180deg, #aaa 0%, #777 40%, #555 100%)",
                      borderRadius: "1.5px", boxShadow: "0 1px 2px rgba(0,0,0,0.3)" }}
                    animate={{ rotate: isPlaying ? 20 : 0 }}
                    transition={{ duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
                  >
                    <div className="absolute left-[-10px] top-[-4px]" style={{
                      width: "10px", height: "10px",
                      background: "linear-gradient(135deg, #999 0%, #666 50%, #444 100%)",
                      borderRadius: "1px 4px 4px 1px", boxShadow: "0 1px 2px rgba(0,0,0,0.3)" }} />
                    <div className="absolute right-[-6px] top-[-2px] w-[8px] h-[8px] rounded-full" style={{
                      background: "radial-gradient(circle at 40% 35%, #888 0%, #444 100%)",
                      boxShadow: "0 1px 2px rgba(0,0,0,0.3)" }} />
                  </motion.div>
                </div>

                <AnimatePresence mode="wait">
                  <motion.div key={currentTrack} initial={{ opacity: 0, y: 3 }}
                    animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -3 }}
                    transition={{ duration: 0.25 }} className="text-center mt-3">
                    <h3 className="text-xs font-medium text-text-primary truncate max-w-[200px]">{track.title}</h3>
                    <p className="text-[10px] text-text-muted mt-0.5">{track.artist}</p>
                  </motion.div>
                </AnimatePresence>

                {/* Progress */}
                <div className="w-full mt-2 px-2">
                  <div className="relative h-1 bg-white/[0.06] rounded-full overflow-hidden cursor-pointer"
                    onClick={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const ratio = (e.clientX - rect.left) / rect.width;
                      seek(ratio);
                    }}>
                    <div className="absolute inset-y-0 left-0 rounded-full transition-[width] duration-100"
                      style={{ width: `${progress}%`, background: "linear-gradient(90deg, #c084fc, #7DCDE8)" }} />
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-[9px] text-text-muted">{formatTime(currentTime)}</span>
                    <span className="text-[9px] text-text-muted">{formatTime(duration)}</span>
                  </div>
                </div>

                {/* Volume */}
                <div className="w-full px-2 mt-1">
                  <div
                    className="flex items-center gap-1.5 cursor-pointer"
                    onMouseEnter={() => setVolumeExpanded(true)}
                    onMouseLeave={() => setVolumeExpanded(false)}
                  >
                    <span className="text-text-muted flex-shrink-0" onClick={() => setVolumeExpanded(!volumeExpanded)}>
                      <VolumeIcon />
                    </span>
                    <motion.div
                      className="h-3 flex items-center flex-1"
                      animate={{ width: volumeExpanded ? "auto" : 0, opacity: volumeExpanded ? 1 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      {volumeExpanded && (
                        <div
                          className="relative h-1 bg-white/[0.06] rounded-full flex-1 cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            const rect = e.currentTarget.getBoundingClientRect();
                            setVolume((e.clientX - rect.left) / rect.width);
                          }}
                        >
                          <div
                            className="absolute inset-y-0 left-0 rounded-full"
                            style={{
                              width: `${volume * 100}%`,
                              background: "linear-gradient(90deg, #7DCDE8, #c084fc)",
                            }}
                          />
                        </div>
                      )}
                    </motion.div>
                  </div>
                </div>

                {/* Controls */}
                <div className="flex items-center justify-center gap-3 mt-2">
                  <button onClick={prev}
                    className="w-7 h-7 flex items-center justify-center rounded-full text-text-muted hover:text-text-primary transition-colors"
                    aria-label="上一首">
                    <SkipBack weight="fill" className="w-3.5 h-3.5" />
                  </button>
                  <motion.button onClick={toggle} disabled={!isLoaded || hasError} whileTap={{ scale: 0.9 }}
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${!isLoaded || hasError ? "bg-white/[0.04] text-text-muted cursor-not-allowed" : "bg-accent text-white shadow-lg shadow-accent/20"}`}
                    aria-label={isPlaying ? "暂停" : "播放"}>
                    {isPlaying ? <Pause weight="fill" className="w-4 h-4" /> : <Play weight="fill" className="w-4 h-4 ml-0.5" />}
                  </motion.button>
                  <button onClick={next}
                    className="w-7 h-7 flex items-center justify-center rounded-full text-text-muted hover:text-text-primary transition-colors"
                    aria-label="下一首">
                    <SkipForward weight="fill" className="w-3.5 h-3.5" />
                  </button>
                </div>

                {hasError && (
                  <p className="text-[9px] text-text-muted mt-1">放入 MP3 到 public/music/ 即可</p>
                )}
              </div>

              {/* Playlist overlay */}
              <AnimatePresence>
                {playlistOpen && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="absolute inset-0 z-30 bg-[#111318]/98 backdrop-blur-xl rounded-2xl flex flex-col"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.05]">
                      <span className="text-xs font-medium text-text-primary">
                        播放列表 ({tracks.length})
                      </span>
                      <button
                        onClick={() => setPlaylistOpen(false)}
                        className="w-6 h-6 rounded-full flex items-center justify-center
                          bg-white/5 hover:bg-white/10 text-text-muted hover:text-text-primary transition-colors"
                        aria-label="关闭列表"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Track list */}
                    <div className="flex-1 overflow-y-auto py-1"
                      style={{ maxHeight: "250px" }}>
                      {tracks.map((t, i) => (
                        <button
                          key={i}
                          onClick={() => {
                            setTrack(i);
                            setPlaylistOpen(false);
                          }}
                          className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors
                            hover:bg-white/[0.04] ${i === currentTrack ? "bg-white/[0.03]" : ""}`}
                        >
                          <span className="w-5 text-[10px] text-text-muted flex-shrink-0 text-right">
                            {i + 1}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className={`text-xs truncate ${i === currentTrack ? "text-accent font-medium" : "text-text-primary"}`}>
                              {t.title}
                            </div>
                            <div className="text-[9px] text-text-muted truncate">{t.artist}</div>
                          </div>
                          {i === currentTrack && isPlaying && (
                            <div className="flex gap-0.5 items-end h-3 flex-shrink-0">
                              <motion.div className="w-0.5 bg-accent rounded-full" animate={{ height: [3, 8, 3] }} transition={{ duration: 0.6, repeat: Infinity }} />
                              <motion.div className="w-0.5 bg-accent rounded-full" animate={{ height: [8, 3, 8] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }} />
                              <motion.div className="w-0.5 bg-accent rounded-full" animate={{ height: [4, 10, 4] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }} />
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
