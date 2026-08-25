import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import BlogShell from "@/components/blog-shell";
import { ThemeProvider } from "@/components/theme-toggle";
import FloatingParticles from "@/components/floating-particles";
import BackgroundLayer from "@/components/background-layer";
import SmoothScroll from "@/components/smooth-scroll";
import WelcomeOverlay from "@/components/welcome-overlay";
import FontLoader from "@/components/font-loader";
import ThemeLoader from "@/components/theme-loader";
import Live2DWidget from "@/components/live2d-widget";
import EasterEggs from "@/components/easter-eggs";
import OneLiner from "@/components/one-liner";
import { SiteConfigProvider } from "@/components/site-config-provider";
import { MusicProvider } from "@/components/music-context";
import { SITE } from "@/lib/config";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-geist",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: `${SITE.name} — ${SITE.description}`,
    template: `%s — ${SITE.name}`,
  },
  description: `个人博客 / ${SITE.description}。${SITE.tagline}`,
  keywords: ["博客", "技术", "编程", "开发", "全栈"],
  authors: [{ name: SITE.name }],
  openGraph: {
    title: SITE.name,
    description: SITE.description,
    url: SITE.url,
    siteName: SITE.name,
    locale: "zh_CN",
    type: "website",
    images: [
      {
        url: "/og-cover.jpg",
        width: 1200,
        height: 630,
        alt: SITE.name,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE.name,
    description: SITE.description,
    images: ["/og-cover.jpg"],
  },
  robots: {
    index: true,
    follow: true,
  },
  metadataBase: new URL(SITE.url),
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/favicon.ico",
  },
  alternates: {
    canonical: "/",
  },
};

export const viewport: Viewport = {
  themeColor: "#1b1b22",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" className={`${inter.variable} ${jetbrainsMono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `(function(){try{var t=localStorage.getItem('devlog-theme')||'dark';if(t==='light')document.documentElement.classList.add('light')}catch(e){}})();
/* Next.js 14 head 管理竞态防护: 路由切换时 React 卸载的 head 节点可能已被
   router 提前移除, removeChild 会抛 NotFoundError 导致整页崩溃 (next#58055)。
   节点本就不在 DOM 中, 幂等跳过是安全的。 */
(function(){
  var origRC = Node.prototype.removeChild;
  Node.prototype.removeChild = function(child){
    if (child && child.parentNode !== this) return child;
    return origRC.apply(this, arguments);
  };
  var origIB = Node.prototype.insertBefore;
  Node.prototype.insertBefore = function(node, ref){
    if (ref && ref.parentNode !== this) return node;
    return origIB.apply(this, arguments);
  };
})()` }} />
        {/* WebSite 结构化数据 */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: SITE.name,
              description: `${SITE.description}。${SITE.tagline}`,
              url: SITE.url,
            }),
          }}
        />
      </head>
      <body className="min-h-screen flex flex-col font-sans bg-bg">
        <SiteConfigProvider>
        <ThemeProvider>
          <MusicProvider>
            <BlogShell>{children}</BlogShell>
          </MusicProvider>
        </ThemeProvider>
        <WelcomeOverlay />
        <ThemeLoader />
        <FontLoader />
        <BackgroundLayer />
        <FloatingParticles />
        <Live2DWidget />
        <SmoothScroll />
        <EasterEggs />
        <OneLiner />
        </SiteConfigProvider>
      </body>
    </html>
  );
}
