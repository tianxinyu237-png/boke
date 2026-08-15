"use client";

import { motion, AnimatePresence } from "motion/react";
import {
  Play, Pause, SkipForward, SkipBack,
  SpeakerHigh, SpeakerLow, SpeakerX, Repeat, Shuffle,
} from "@phosphor-icons/react";
import { useMusic } from "@/components/music-context";
import AudioVisualizer from "@/components/audio-visualizer";
import { SITE } from "@/lib/config";

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

export default function HeroSection() {
  const music = useMusic();
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
    setVolume,
    setPlayMode,
  } = music;

  const track = tracks[currentTrack] || { title: "暂无歌曲", artist: "", src: "" };
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const isEmpty = tracks.length === 0 || (tracks.length === 1 && !tracks[0].src);

  function VolumeIcon() {
    if (volume === 0) return <SpeakerX className="w-3.5 h-3.5" />;
    if (volume < 0.5) return <SpeakerLow className="w-3.5 h-3.5" />;
    return <SpeakerHigh className="w-3.5 h-3.5" />;
  }

  return (
    <section
      className={`relative flex items-center justify-center overflow-hidden transition-[min-height] duration-700 ${
        isEmpty ? "min-h-[45vh]" : "min-h-[75vh]"
      }`}
    >
      {/* Ambient background glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 65% 45%, rgb(var(--color-accent) / 0.10) 0%, transparent 60%)," +
            "radial-gradient(ellipse 40% 60% at 25% 55%, rgb(var(--color-accent) / 0.04) 0%, transparent 50%)",
        }}
      />

      {/* Subtle grid texture */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgb(var(--color-surface) / 0.05) 1px, transparent 1px)," +
            "linear-gradient(90deg, rgb(var(--color-surface) / 0.05) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      <div className="relative z-10 w-full max-w-6xl mx-auto px-6 flex flex-col lg:flex-row items-center justify-center gap-12 lg:gap-20">
        {/* Left: Text */}
        <motion.div
          className="relative flex flex-col items-center lg:items-start text-center lg:text-left max-w-md"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          {/* 局部深色渐变层：提升文字在背景图上的可读性 */}
          <div
            aria-hidden
            className="absolute -inset-x-6 -inset-y-4 rounded-3xl pointer-events-none"
            style={{
              background:
                "linear-gradient(180deg, rgba(8,8,18,0.80) 0%, rgba(8,8,18,0.62) 60%, rgba(8,8,18,0.35) 100%)",
              zIndex: 0,
            }}
          />
          <h1
            className="relative z-10 text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-none"
            style={{
              background:
                "linear-gradient(135deg, var(--hero-from) 0%, var(--hero-via) 50%, var(--hero-to) 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            {SITE.name}
          </h1>
          <p className="relative z-10 mt-4 text-xl sm:text-2xl text-white leading-relaxed max-w-sm">
            {SITE.description}
          </p>
          <p className="relative z-10 mt-2 text-base sm:text-lg text-white">{SITE.tagline}</p>

          {/* Mini player controls */}
          <div className="relative z-10 mt-8 flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-white/[0.04] backdrop-blur-md border border-white/[0.06]">
            {/* Play mode */}
            <button
              onClick={() => setPlayMode(MODE_NEXT[playMode] as "sequential" | "loop" | "shuffle")}
              className="w-6 h-6 flex items-center justify-center rounded-full text-text-muted hover:text-accent transition-colors"
              title={MODE_LABELS[playMode]}
              aria-label={MODE_LABELS[playMode]}
            >
              {playMode === "shuffle" ? (
                <Shuffle className="w-3 h-3" />
              ) : playMode === "loop" ? (
                <Repeat className="w-3 h-3" />
              ) : (
                <span className="text-[8px] font-bold">&#8645;</span>
              )}
            </button>

            {/* Prev */}
            <button
              onClick={prev}
              className="w-7 h-7 flex items-center justify-center rounded-full text-text-muted hover:text-text-primary transition-colors"
              aria-label="上一首"
            >
              <SkipBack weight="fill" className="w-3.5 h-3.5" />
            </button>

            {/* Play/Pause */}
            <motion.button
              onClick={toggle}
              disabled={!isLoaded || hasError}
              whileTap={{ scale: 0.9 }}
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                !isLoaded || hasError
                  ? "bg-white/[0.04] text-text-muted cursor-not-allowed"
                  : "bg-accent text-white shadow-lg shadow-accent/20"
              }`}
              aria-label={isPlaying ? "暂停" : "播放"}
            >
              {isPlaying ? (
                <Pause weight="fill" className="w-4 h-4" />
              ) : (
                <Play weight="fill" className="w-4 h-4 ml-0.5" />
              )}
            </motion.button>

            {/* Next */}
            <button
              onClick={next}
              className="w-7 h-7 flex items-center justify-center rounded-full text-text-muted hover:text-text-primary transition-colors"
              aria-label="下一首"
            >
              <SkipForward weight="fill" className="w-3.5 h-3.5" />
            </button>

            {/* Track info */}
            <div className="ml-1 pl-3 border-l border-white/[0.08] min-w-0">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentTrack}
                  initial={{ opacity: 0, x: 4 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -4 }}
                  transition={{ duration: 0.2 }}
                  className="flex flex-col"
                >
                  <span className="text-xs font-medium text-text-primary truncate max-w-[120px]">
                    {track.title}
                  </span>
                  <span className="text-[10px] text-text-muted truncate max-w-[120px]">
                    {track.artist}
                  </span>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Volume */}
            <div className="ml-1 pl-2 border-l border-white/[0.08] flex items-center gap-1">
              <span className="text-text-muted">
                <VolumeIcon />
              </span>
              <div className="relative h-5 flex items-center" style={{ width: "60px" }}>
                <div
                  className="relative h-1 bg-white/[0.06] rounded-full w-full cursor-pointer"
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
                      background: "linear-gradient(90deg, var(--hero-from), var(--hero-via), var(--hero-to))",
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Right: Large Turntable (hidden on mobile) */}
        <motion.div
          className="flex-shrink-0 hidden lg:block"
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          <div
            className="relative bg-white/[0.03] backdrop-blur-md border border-white/[0.06] rounded-3xl shadow-2xl shadow-black/20"
            style={{ width: "320px", height: "400px" }}
          >
            {/* Subtle inner glow */}
            <div
              className="absolute inset-0 rounded-3xl pointer-events-none"
              style={{
                background:
                  "radial-gradient(ellipse at 50% 30%, rgb(var(--color-accent) / 0.06) 0%, transparent 60%)",
              }}
            />

            {isEmpty ? (
              /* Empty state */
              <div className="flex flex-col items-center justify-center h-full gap-4 text-text-muted">
                <MusicNotePlaceholder />
                <p className="text-sm text-text-muted/60">暂无歌曲</p>
                <p className="text-xs text-text-muted/40">在管理后台添加你的第一首歌</p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full pt-6 pb-8 px-6">
                {/* Turntable */}
                <div className="relative w-[240px] h-[240px]">
                  {/* Dark platter */}
                  <div
                    className="absolute inset-0 rounded-full"
                    style={{
                      background:
                        "radial-gradient(circle at 50% 45%, #1a1a1a 0%, #0d0d0d 60%, #050505 100%)",
                      boxShadow: "inset 0 3px 24px rgba(0,0,0,0.6), 0 4px 32px rgba(0,0,0,0.3)",
                    }}
                  >
                    {/* Vinyl record */}
                    <motion.div
                      className="absolute inset-[6%] rounded-full"
                      style={{
                        transform: `rotate(${music.vinylAngle}deg)`,

                        background:
                          "conic-gradient(from 0deg, #1a1a1a 0deg, #0f0f0f 2deg, #1a1a1a 4deg, #111 6deg, #1a1a1a 8deg, #0f0f0f 10deg, #1a1a1a 12deg, #111 14deg, #1a1a1a 16deg, #0f0f0f 18deg, #1a1a1a 20deg)",
                        boxShadow: "0 4px 24px rgba(0,0,0,0.4)",
                      }}
                    >
                      <div className="absolute inset-[3%] rounded-full border border-white/[0.02]" />
                      <div className="absolute inset-[8%] rounded-full border border-white/[0.02]" />
                      <div className="absolute inset-[16%] rounded-full border border-white/[0.015]" />
                      <div className="absolute inset-[26%] rounded-full border border-white/[0.012]" />
                      <div className="absolute inset-[38%] rounded-full border border-white/[0.01]" />

                      {/* Center label */}
                      <div
                        className="absolute inset-[28%] rounded-full flex flex-col items-center justify-center"
                        style={{
                          background:
                            "linear-gradient(135deg, #c084fc 0%, #7DCDE8 50%, #f093fb 100%)",
                          boxShadow:
                            "0 0 24px rgba(192,132,252,0.3), inset 0 1px 0 rgba(255,255,255,0.15)",
                        }}
                      >
                        <span className="text-[9px] font-bold text-white/90 tracking-wider text-center leading-tight">
                          {track.title.length > 0 ? track.title.slice(0, 12) : "LIGHT"}
                          <br />
                          MUSIC
                        </span>
                      </div>
                      <div className="absolute inset-[44%] rounded-full bg-[#0a0a0a] border border-white/[0.06] flex items-center justify-center">
                        <div className="w-[22%] h-[22%] rounded-full bg-[#1a1a1a]" />
                      </div>
                    </motion.div>
                  </div>

                  {/* Tonearm base */}
                  <div
                    className="absolute top-[24px] right-[14px] w-[13px] h-[13px] rounded-full z-10"
                    style={{
                      background:
                        "radial-gradient(circle at 40% 35%, #888 0%, #555 40%, #333 100%)",
                      boxShadow: "0 1px 6px rgba(0,0,0,0.4)",
                    }}
                  />
                  {/* Tonearm */}
                  <motion.div
                    className="absolute z-10"
                    style={{
                      top: "30px",
                      right: "20px",
                      width: "88px",
                      height: "4px",
                      transformOrigin: "100% 0%",
                      background: "linear-gradient(180deg, #bbb 0%, #888 40%, #666 100%)",
                      borderRadius: "2px",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.4)",
                    }}
                    animate={{ rotate: isPlaying ? 22 : 0 }}
                    transition={{ duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
                  >
                    {/* Headshell */}
                    <div
                      className="absolute left-[-12px] top-[-5px]"
                      style={{
                        width: "12px",
                        height: "14px",
                        background: "linear-gradient(135deg, #aaa 0%, #777 50%, #555 100%)",
                        borderRadius: "2px 5px 5px 2px",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.4)",
                      }}
                    />
                    {/* Counterweight */}
                    <div
                      className="absolute right-[-8px] top-[-3px] w-[10px] h-[10px] rounded-full"
                      style={{
                        background: "radial-gradient(circle at 40% 35%, #999 0%, #555 100%)",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
                      }}
                    />
                  </motion.div>
                </div>

                {/* Audio visualizer */}
                <AudioVisualizer className="w-full px-6 mt-2" height={36} />

              {/* Progress bar */}
                <div className="w-full mt-3 px-4">
                  <div
                    className="relative h-1.5 bg-white/[0.06] rounded-full overflow-hidden cursor-pointer"
                    onClick={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const ratio = (e.clientX - rect.left) / rect.width;
                      seek(ratio);
                    }}
                  >
                    <div
                      className="absolute inset-y-0 left-0 rounded-full transition-[width] duration-100"
                      style={{
                        width: `${progress}%`,
                        background: "linear-gradient(90deg, var(--hero-from), var(--hero-via), var(--hero-to))",
                      }}
                    />
                  </div>
                  <div className="flex justify-between mt-1.5">
                    <span className="text-[10px] text-text-muted/60">{formatTime(currentTime)}</span>
                    <span className="text-[10px] text-text-muted/60">{formatTime(duration)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Scroll hint */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.6 }}
      >
        <span className="text-[10px] text-text-muted/40 tracking-widest uppercase">Scroll</span>
        <motion.div
          className="w-px h-8 bg-gradient-to-b from-text-muted/20 to-transparent"
          animate={{ scaleY: [1, 1.5, 1], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />
      </motion.div>
    </section>
  );
}

function MusicNotePlaceholder() {
  return (
    <div className="w-24 h-24 rounded-full bg-white/[0.03] border border-white/[0.04] flex items-center justify-center">
      <SpeakerHigh className="w-8 h-8 text-text-muted/20" />
    </div>
  );
}
