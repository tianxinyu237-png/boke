"use client";

import { useRef, useEffect } from "react";
import { useMusic } from "@/components/music-context";

interface Props {
  barCount?: number;
  className?: string;
  height?: number;
}

export default function AudioVisualizer({ barCount = 16, className = "", height = 40 }: Props) {
  const { frequencyBands, isPlaying, isLoaded } = useMusic();
  const barRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Direct DOM manipulation for performance — no React re-render per frame
  useEffect(() => {
    if (!isLoaded || !isPlaying) return;
    const bands = frequencyBands.slice(0, barCount);
    barRefs.current.forEach((el, i) => {
      if (el) {
        const amp = bands[i] || 0;
        el.style.height = Math.max(4, amp * 100) + "%";
        el.style.opacity = String(0.4 + amp * 0.6);
      }
    });
  }, [frequencyBands, isPlaying, isLoaded, barCount]);

  if (!isLoaded || !isPlaying) return null;

  return (
    <div
      className={`flex items-end justify-center gap-[2px] ${className}`}
      style={{ height }}
      aria-hidden="true"
    >
      {Array.from({ length: barCount }).map((_, i) => (
        <div
          key={i}
          ref={(el) => { barRefs.current[i] = el; }}
          className="flex-1 w-full min-w-[3px] rounded-full"
          style={{
            height: "4px",
            opacity: 0.4,
            background: "linear-gradient(180deg, var(--hero-from), var(--hero-via), var(--hero-to))",
            transition: "height 0.08s ease-out, opacity 0.08s ease-out",
          }}
        />
      ))}
    </div>
  );
}
