"use client";

import { useEffect, useState } from "react";

interface Stats {
  totalVisits: number;
  todayVisits: number;
}

function fmt(n: number): string {
  if (n >= 10000) return (n / 10000).toFixed(1) + "w";
  if (n >= 1000) return (n / 1000).toFixed(1) + "k";
  return String(n);
}

export default function VisitorStats() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    const api = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";

    // Record visit
    fetch(`${api}/stats/visit`, { method: "POST" }).catch(() => {});

    // Fetch stats
    fetch(`${api}/stats`)
      .then((r) => r.json())
      .then(setStats)
      .catch(() => {});
  }, []);

  if (!stats) return null;

  return (
    <span className="flex items-center gap-3 text-xs text-text-muted">
      <span title="总访问量">👀 {fmt(stats.totalVisits)}</span>
      <span className="opacity-30">|</span>
      <span title="今日访问">📅 {fmt(stats.todayVisits)}</span>
    </span>
  );
}
