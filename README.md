# devlog-blog 个人博客

一个全栈个人博客系统，前后端分离 + Docker 一键部署。线上地址：<https://tianxinyv.top>

暗色系、毛玻璃质感，支持代码高亮、数学公式、Live2D 看板娘、粒子动效等丰富的视觉与交互特性。

## ✨ 功能特性

**内容**

- 📝 Markdown 文章：代码高亮（Shiki）、数学公式（KaTeX）、表格（GFM）、Mermaid 图
- 🗂 归档 / 分类 / 标签 / 笔记 / 友链 / 碎碎念 / 关于
- 🔍 全文搜索、RSS、Sitemap、robots.txt
- 💬 Giscus 评论

**视觉与交互**

- 🌗 暗色 / 亮色主题切换（无闪烁，防 FOUC）
- ✨ 粒子动效、动态背景层、Live2D 看板娘
- 🎵 音乐播放器
- 🖱 平滑滚动（Lenis）、页面过渡动画、滚动渐入（GSAP ScrollTrigger）

**系统**

- 📊 访客统计（总量 / 今日）
- 🔎 SEO：JSON-LD 结构化数据、OpenGraph、Twitter Card、canonical
- 🛠 管理后台：文章 / 分类 / 笔记 / 碎碎念 / 照片 / 音乐 / 背景 / 字体 / 粒子 的增删改查

## 🛠 技术栈

| 层 | 技术 |
|----|------|
| 前端 | Next.js 14 (App Router) · React 18 · TypeScript · Tailwind CSS 3 |
| 动效 | Motion (Framer Motion) · GSAP · Lenis |
| 内容渲染 | unified / remark / rehype · Shiki · remark-gfm · remark-math + rehype-katex |
| 编辑器 | @uiw/react-md-editor · vditor |
| 后端 | Spring Boot 3.3 · Spring Data JPA · Java 21 |
| 数据库 | H2（文件模式，Docker 卷持久化） |
| 部署 | Docker Compose · Nginx |

## 📁 项目结构

```
devlog-blog/
├── frontend/                 # 前端 Next.js 14 (App Router)
│   ├── app/                  # 页面路由
│   │   ├── page.tsx          # 首页
│   │   ├── posts/[slug]/     # 文章详情
│   │   ├── sum/              # 归档
│   │   ├── categories/       # 分类
│   │   ├── tags/[tag]/       # 标签
│   │   ├── notes/            # 笔记
│   │   ├── links/            # 友链
│   │   ├── moments/          # 碎碎念
│   │   ├── about/            # 关于
│   │   ├── search/           # 搜索
│   │   ├── admin/            # 管理后台
│   │   ├── sitemap.xml/      # Sitemap
│   │   ├── robots.txt/       # robots
│   │   └── rss/              # RSS
│   ├── components/           # React 组件
│   ├── lib/                  # 工具库（markdown 渲染 / 配置 / API）
│   └── public/               # 静态资源（Live2D / 粒子 / 封面）
├── backend/                  # 后端 Spring Boot 3.3
│   └── src/main/java/com/devlog/
│       ├── controller/       # REST API
│       ├── entity/           # JPA 实体
│       ├── repository/       # 数据访问层
│       ├── config/           # 配置（鉴权过滤器 / CORS）
│       └── util/             # 工具（XSS 清洗）
├── nginx/                    # Nginx 反向代理配置
├── docker-compose.yml        # 三容器编排
└── backend.env.example       # 后端环境变量模板
```

## 🚀 本地开发

### 后端（Spring Boot）

```bash
# 需 JDK 21 + Maven
export JAVA_HOME=/path/to/jdk-21
cd backend
mvn spring-boot:run
# 默认监听 http://localhost:8080
```

### 前端（Next.js）

```bash
# 需 Node.js 18+
cd frontend
npm install
npm run dev
# 默认监听 http://localhost:3000
```

前端通过 `NEXT_PUBLIC_API_URL` 访问后端，本地开发默认指向 `http://localhost:8080/api`。

## 🐳 Docker 部署

```bash
# 1. 准备环境变量（复制模板并填入真实值）
cp backend.env.example backend.env
# 编辑 backend.env，填入管理员密码和 token

# 2. 构建并启动
docker compose up -d --build

# 3. 查看状态
docker compose ps
```

三个容器：

| 容器 | 说明 | 端口 |
|------|------|------|
| devlog-backend | Spring Boot 后端 | 8080 |
| devlog-frontend | Next.js 前端 | 3000 |
| devlog-nginx | Nginx 反向代理（对外入口） | 80 |

数据持久化在 Docker 卷 `backend-data`（H2 数据库文件）。

## 🔧 环境变量

| 变量 | 说明 | 位置 |
|------|------|------|
| `APP_ADMIN_PASSWORD` | 后台登录密码 | `backend.env` |
| `APP_ADMIN_TOKEN` | 写操作 API 鉴权 token | `backend.env` |
| `NEXT_PUBLIC_API_URL` | 前端访问后端的地址 | `docker-compose.yml` |
| `NEXT_PUBLIC_SITE_URL` | SEO 站点 URL | `docker-compose.yml` |

> ⚠️ `backend.env` 含敏感信息，已加入 `.gitignore`，请勿提交到仓库。可参考 `backend.env.example`。

## 📄 许可

MIT License
