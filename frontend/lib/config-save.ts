/* ══════════════════════════════════════════════════════════════
   配置保存的统一入口（2026-10-28 新建）

   为什么要有这个文件：
   原来 about / links / projects / theme / resume / oneliner / music /
   site-config 八个模块各自写了一份几乎一样的 save 函数，
   全都是 try { fetch } catch { return false } —— 只返回一个 boolean。

   结果就是：admin 换过 token 之后，浏览器里还攥着旧 token，
   每次保存都被后端 401 拒绝，而前端只能显示「保存失败」三个字。
   用户看到「保存失败」根本不知道是网络问题、参数问题、还是登录过期，
   只能一遍遍地点，永远存不进去。

   现在统一走这里：
     · 401/403 → 明确告诉用户「登录已过期，请重新登录」，并清掉失效 token
     · 5xx      → 报出具体状态码
     · 网络异常 → 单独提示
   调用方拿 SaveResult，可以给出能指导下一步动作的提示。
   ══════════════════════════════════════════════════════════════ */

export type SaveResult =
  | { ok: true }
  | { ok: false; reason: "unauthorized" | "network" | "server"; message: string };

const API_BASE =
  typeof window !== "undefined" ? process.env.NEXT_PUBLIC_API_URL || "/api" : "/api";

/**
 * 把某个配置字段写回服务器。
 * @param key  site-config 里的字段名，如 "linksConfig"
 * @param value 配置对象（自动 JSON.stringify）或已经是字符串的原样发送
 */
export async function putSiteConfig(key: string, value: unknown): Promise<SaveResult> {
  try {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("admin_token") : null;

    const res = await fetch(`${API_BASE}/site-config`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { "X-Api-Key": token } : {}),
      },
      body: JSON.stringify({
        [key]: typeof value === "string" ? value : JSON.stringify(value),
      }),
    });

    if (res.ok) return { ok: true };

    if (res.status === 401 || res.status === 403) {
      // 旧 token 已经判废了，留着只会让人继续点「保存」继续失败
      if (typeof window !== "undefined") localStorage.removeItem("admin_token");
      return {
        ok: false,
        reason: "unauthorized",
        message: "登录已过期，请重新登录后再保存",
      };
    }

    return { ok: false, reason: "server", message: `服务器返回 ${res.status}` };
  } catch {
    return { ok: false, reason: "network", message: "网络异常，请检查连接后重试" };
  }
}

/** 保存失败时的统一善后：给出可读提示；若登录过期则跳回登录页 */
export function handleSaveFailure(
  result: SaveResult,
  toast: (msg: string, type?: "success" | "error" | "info") => void
): boolean {
  if (result.ok) return false;
  toast(result.message, "error");
  if (result.reason === "unauthorized") {
    setTimeout(() => {
      window.location.href = "/admin";
    }, 1600);
  }
  return true;
}
