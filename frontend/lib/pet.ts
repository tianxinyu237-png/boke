// 看板猫(Pet)配置与本地互动状态
// 存储: 配置双写 localStorage(devlog-pet-config) + 服务器 SiteConfig.petConfig
//       互动状态(好感度)只存 localStorage(devlog-pet-state), 不给后端添负担

export interface PetConfig {
  // 显示
  enabled: boolean;
  showOnMobile: boolean;
  pageMode: "all" | "include" | "exclude";
  includePaths: string; // \n 分隔, 支持 * 通配
  excludePaths: string;
  position: "left" | "right";
  bottomOffset: number; // px
  width: number; // 桌面 canvas 宽 px
  mobileScale: number;
  opacityDefault: number;
  opacityOnHover: number;
  // 模型
  modelPath: string; // 相对 /live2d/models/
  modelScale: number;
  petName: string; // 气泡 {name} 占位符替换
  // 语库(每行一条)
  welcomeLines: string;
  clickLines: string;
  petLines: string;
  feedLines: string;
  idleLines: string;
  angryLines: string;
  levelUpLines: string;
  // 行为
  welcomeEnabled: boolean;
  idleEnabled: boolean;
  idleInterval: number; // 秒
  bubbleSeconds: number; // 气泡停留秒
  feelingsEnabled: boolean; // 好感度开关
  dailyMax: number; // 每日好感度加成上限
  dragEnabled: boolean;
}

export const PET_MODELS = [
  { value: "hijiki/hijiki.model.json", label: "🐈 hijiki 灰猫(内置)" },
];

export const POSITIONS = [
  { value: "left", label: "左下角" },
  { value: "right", label: "右下角" },
];

export const LEVELS: { min: number; name: string }[] = [
  { min: 0, name: "陌生" },
  { min: 20, name: "眼熟" },
  { min: 60, name: "朋友" },
  { min: 120, name: "亲密" },
  { min: 200, name: "家人" },
];

export const DEFAULT_PET: PetConfig = {
  enabled: true,
  showOnMobile: true,
  pageMode: "all",
  includePaths: "",
  excludePaths: "",
  position: "left",
  bottomOffset: 0,
  width: 140,
  mobileScale: 0.5,
  opacityDefault: 0.8,
  opacityOnHover: 0.2,
  modelPath: "hijiki/hijiki.model.json",
  modelScale: 1,
  petName: "小猫",
  welcomeLines: [
    "欢迎来到我的博客，喵～",
    "你来啦！今天想看点什么？",
    "你好呀～我是{name}，陪你逛博客",
  ].join("\n"),
  clickLines: [
    "喵？叫我干嘛～",
    "别点啦，再点我要害羞了！",
    "嘿嘿，被发现了～",
    "要不要去看看其他文章？",
    "敲键盘累了？摸摸我放松一下",
  ].join("\n"),
  petLines: [
    "喵呜～好舒服……",
    "呼噜呼噜……再摸摸",
    "蹭蹭你～",
    "最喜欢被摸头了",
  ].join("\n"),
  feedLines: [
    "小鱼干！谢谢投喂！",
    "咔嚓咔嚓……好吃！",
    "唔姆，记住你的味道了",
    "嘿嘿，好感度又涨啦",
  ].join("\n"),
  idleLines: [
    "今天也要加油哦～",
    "代码写累了就休息一下吧",
    "这篇文章写得真认真呢",
    "摸摸鱼，看看窗外吧",
    "喜欢的话记得点赞哦",
  ].join("\n"),
  angryLines: [
    "喵！再戳我要生气了！",
    "别闹了啦！",
    "你当我是玩具吗！",
    "哼！暂时不理你三秒",
  ].join("\n"),
  levelUpLines: [
    "我们已经是「%s」啦！",
    "羁绊升级：%s！以后多多关照喵",
  ].join("\n"),
  welcomeEnabled: true,
  idleEnabled: true,
  idleInterval: 45,
  bubbleSeconds: 6,
  feelingsEnabled: true,
  dailyMax: 20,
  dragEnabled: true,
};

export const CONFIG_KEY = "devlog-pet-config";
export const HIDDEN_KEY = "devlog-pet-hidden";
export const STATE_KEY = "devlog-pet-state";

const API_BASE =
  typeof window !== "undefined"
    ? process.env.NEXT_PUBLIC_API_URL || "/api"
    : "/api";

export function normalizeConfig(parsed: Partial<PetConfig> | null | undefined): PetConfig {
  const c: PetConfig = { ...DEFAULT_PET, ...(parsed || {}) };
  const isNum = (v: unknown): v is number => typeof v === "number" && !Number.isNaN(v);
  const isBool = (v: unknown): v is boolean => typeof v === "boolean";
  const isStr = (v: unknown): v is string => typeof v === "string";
  if (!isBool(c.enabled)) c.enabled = DEFAULT_PET.enabled;
  if (!isBool(c.showOnMobile)) c.showOnMobile = DEFAULT_PET.showOnMobile;
  if (!isBool(c.welcomeEnabled)) c.welcomeEnabled = DEFAULT_PET.welcomeEnabled;
  if (!isBool(c.idleEnabled)) c.idleEnabled = DEFAULT_PET.idleEnabled;
  if (!isBool(c.feelingsEnabled)) c.feelingsEnabled = DEFAULT_PET.feelingsEnabled;
  if (!isBool(c.dragEnabled)) c.dragEnabled = DEFAULT_PET.dragEnabled;
  if (!isStr(c.pageMode) || !["all", "include", "exclude"].includes(c.pageMode)) c.pageMode = DEFAULT_PET.pageMode;
  if (!isStr(c.position) || !["left", "right"].includes(c.position)) c.position = DEFAULT_PET.position;
  if (!isNum(c.bottomOffset)) c.bottomOffset = DEFAULT_PET.bottomOffset;
  if (!isNum(c.width) || c.width < 40) c.width = DEFAULT_PET.width;
  if (!isNum(c.mobileScale) || c.mobileScale <= 0) c.mobileScale = DEFAULT_PET.mobileScale;
  if (!isNum(c.opacityDefault) || c.opacityDefault <= 0) c.opacityDefault = DEFAULT_PET.opacityDefault;
  if (!isNum(c.opacityOnHover) || c.opacityOnHover < 0) c.opacityOnHover = DEFAULT_PET.opacityOnHover;
  if (!isNum(c.modelScale) || c.modelScale <= 0) c.modelScale = DEFAULT_PET.modelScale;
  if (!isNum(c.idleInterval) || c.idleInterval < 10) c.idleInterval = DEFAULT_PET.idleInterval;
  if (!isNum(c.bubbleSeconds) || c.bubbleSeconds < 2) c.bubbleSeconds = DEFAULT_PET.bubbleSeconds;
  if (!isNum(c.dailyMax) || c.dailyMax < 1) c.dailyMax = DEFAULT_PET.dailyMax;
  if (!isStr(c.modelPath)) c.modelPath = DEFAULT_PET.modelPath;
  if (!isStr(c.petName)) c.petName = DEFAULT_PET.petName;
  if (!isStr(c.includePaths)) c.includePaths = "";
  if (!isStr(c.excludePaths)) c.excludePaths = "";
  if (!isStr(c.welcomeLines)) c.welcomeLines = "";
  if (!isStr(c.clickLines)) c.clickLines = "";
  if (!isStr(c.petLines)) c.petLines = "";
  if (!isStr(c.feedLines)) c.feedLines = "";
  if (!isStr(c.idleLines)) c.idleLines = "";
  if (!isStr(c.angryLines)) c.angryLines = "";
  if (!isStr(c.levelUpLines)) c.levelUpLines = "";
  return c;
}

export function loadPetConfig(): PetConfig {
  if (typeof window === "undefined") return DEFAULT_PET;
  try {
    const raw = localStorage.getItem(CONFIG_KEY);
    if (raw) return normalizeConfig(JSON.parse(raw));
  } catch {}
  return DEFAULT_PET;
}

export function savePetConfig(config: PetConfig) {
  if (typeof window === "undefined") return;
  localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
}

export async function loadPetConfigFromServer(): Promise<PetConfig | null> {
  try {
    const res = await fetch(`${API_BASE}/site-config`);
    if (!res.ok) return null;
    const data = await res.json();
    if (data.petConfig) {
      const parsed =
        typeof data.petConfig === "string" ? JSON.parse(data.petConfig) : data.petConfig;
      if (parsed && typeof parsed === "object") return normalizeConfig(parsed);
    }
  } catch {}
  return null;
}

export async function savePetConfigToServer(config: PetConfig): Promise<boolean> {
  try {
    const token = localStorage.getItem("admin_token");
    const res = await fetch(`${API_BASE}/site-config`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { "X-Api-Key": token } : {}),
      },
      body: JSON.stringify({ petConfig: JSON.stringify(config) }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

// ── 语库工具 ──

export function pickLine(lines: string, name?: string): string | null {
  if (!lines) return null;
  const arr = lines
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
  if (!arr.length) return null;
  const line = arr[Math.floor(Math.random() * arr.length)];
  return name ? line.replace(/\{name\}/g, name) : line;
}

// ── 好感度状态 ──

export interface PetState {
  affection: number; // 累计好感(浮点)
  interactions: number; // 互动总次数
  date: string; // YYYY-MM-DD(今日加成计数用)
  today: number; // 今日已加好感
}

export function getLevelIndex(affection: number): number {
  const a = Math.floor(affection);
  let idx = 0;
  for (let i = 0; i < LEVELS.length; i++) {
    if (a >= LEVELS[i].min) idx = i;
  }
  return idx;
}

export function getLevelName(affection: number): string {
  return LEVELS[getLevelIndex(affection)].name;
}

export function loadPetState(): PetState {
  if (typeof window === "undefined")
    return { affection: 0, interactions: 0, date: "", today: 0 };
  try {
    const raw = localStorage.getItem(STATE_KEY);
    if (raw) {
      const s = JSON.parse(raw);
      return {
        affection: typeof s.affection === "number" ? s.affection : 0,
        interactions: typeof s.interactions === "number" ? s.interactions : 0,
        date: typeof s.date === "string" ? s.date : "",
        today: typeof s.today === "number" ? s.today : 0,
      };
    }
  } catch {}
  return { affection: 0, interactions: 0, date: "", today: 0 };
}

export function savePetState(s: PetState) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STATE_KEY, JSON.stringify(s));
}

export function resetPetState(): PetState {
  const s = { affection: 0, interactions: 0, date: "", today: 0 };
  savePetState(s);
  return s;
}

function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

/**
 * 好感度加成(受每日上限约束)。返回实际加成与升级信息。
 */
export function applyAffection(
  delta: number,
  dailyMax: number
): { added: number; state: PetState; prevLevel: number; newLevel: number } {
  const state = loadPetState();
  const today = todayStr();
  if (state.date !== today) {
    state.date = today;
    state.today = 0;
  }
  const prevLevel = getLevelIndex(state.affection);
  const room = Math.max(0, dailyMax - state.today);
  const added = Math.min(delta, room);
  if (added > 0) {
    state.affection += added;
    state.interactions += 1;
    state.today += added;
  }
  savePetState(state);
  return { added, state, prevLevel, newLevel: getLevelIndex(state.affection) };
}

// ── 路径匹配(页面范围) ──

export function matchPage(pathname: string, mode: PetConfig["pageMode"], includeRaw: string, excludeRaw: string): boolean {
  if (mode === "all") return true;
  const toList = (raw: string) =>
    raw
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
  const toRe = (pat: string) =>
    new RegExp("^" + pat.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*") + "$");
  if (mode === "include") {
    return toList(includeRaw).some((p) => toRe(p).test(pathname));
  }
  // exclude
  return !toList(excludeRaw).some((p) => toRe(p).test(pathname));
}
