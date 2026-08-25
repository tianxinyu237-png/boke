import { NextRequest, NextResponse } from "next/server";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 内部接口跳过(避免递归记录)
  if (pathname.startsWith("/api/visitors/")) {
    return NextResponse.next();
  }

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";

  const ua = req.headers.get("user-agent") || "";
  const referer = req.headers.get("referer") || "";

  try {
    // 用请求自身 origin 拼后端地址:线上经 nginx→rewrite 到 backend,本机 dev 直通 8080
    // 注意:不要用 process.env 取地址 — edge runtime 编译时 env 替换不可靠(实测被替换成 undefined)
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 2000);
    const res = await fetch(`${req.nextUrl.origin}/api/visitors/record`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ip,
        ua: ua.slice(0, 512),
        path: pathname.slice(0, 255),
        method: req.method,
        status: 0,
        referer: (referer || "").slice(0, 512),
      }),
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (res.ok) {
      const data = await res.json();
      // 该 IP 在黑名单中 → 直接拦截
      if (data.blocked) {
        return new NextResponse("403 Forbidden", { status: 403 });
      }
    }
  } catch {
    // 记录失败不影响正常访问
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|uploads/|api/visitors/).*)"],
};
