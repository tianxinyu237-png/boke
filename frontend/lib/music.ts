export interface Track {
  title: string;
  artist: string;
  src: string;
}

export interface MusicConfig {
  tracks: Track[];
}

export const DEFAULT_MUSIC: MusicConfig = {
  tracks: [
    { title: "Rainy Day Cafe", artist: "Lofi Coffee", src: "/music/01-sample.mp3" },
    { title: "Jazz Piano Nights", artist: "Moonlight Trio", src: "/music/01-sample.mp3" },
    { title: "Sakura Breeze", artist: "Tokyo LoFi", src: "/music/01-sample.mp3" },
    { title: "Night Waves", artist: "Ocean Collective", src: "/music/01-sample.mp3" },
    { title: "Forest Walk", artist: "Nature Beats", src: "/music/01-sample.mp3" },
    { title: "Morning Dew", artist: "Sunrise Sounds", src: "/music/01-sample.mp3" },
    { title: "Starlight", artist: "Cosmic Drift", src: "/music/01-sample.mp3" },
    { title: "Quiet Studio", artist: "Ambient Works", src: "/music/01-sample.mp3" },
  ],
};

const API_BASE = typeof window !== "undefined"
  ? (process.env.NEXT_PUBLIC_API_URL || "/api")
  : "/api";

export async function loadMusicConfig(): Promise<MusicConfig> {
  try {
    const res = await fetch(`${API_BASE}/site-config`);
    if (!res.ok) return DEFAULT_MUSIC;
    const data = await res.json();
    if (data.musicConfig) {
      const parsed = typeof data.musicConfig === "string"
        ? JSON.parse(data.musicConfig)
        : data.musicConfig;
      return { ...DEFAULT_MUSIC, ...parsed };
    }
  } catch {}
  return DEFAULT_MUSIC;
}

export async function saveMusicConfig(config: MusicConfig): Promise<boolean> {
  try {
    const token = localStorage.getItem("admin_token");
    const res = await fetch(`${API_BASE}/site-config`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { "X-Api-Key": token } : {}),
      },
      body: JSON.stringify({ musicConfig: JSON.stringify(config) }),
    });
    return res.ok;
  } catch {
    return false;
  }
}
