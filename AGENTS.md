# AGENTS.md

面向 AI 编码代理的项目说明。阅读本文即可了解本项目的架构、命令与约定。

## 项目概述

这是一个个人主页 + 博客站点（`ap-blog`），基于 **SvelteKit 2 + Svelte 5（runes 模式）+ TypeScript + Vite 8**。由 `../demo` 原型规范化迁移而来。包含三个页面板块：

- `/`：主页，居中的个人名片卡（`ProfileCard`）
- `/blog`：博客列表与文章页，内容来自文件系统上的 Markdown 文件，**无数据库**
- `/projects`：项目展示页（数据硬编码在页面组件里）

核心特色：

- 名片卡常驻 layout，用 `svelte/motion` 的 `Tween` 在两个布局锚点之间做共享元素过渡（居中卡片 ↔ 收窄导航栏）
- 运行时从背景图用 canvas + median-cut 算法提取主题色，写入 CSS 变量 `--accent`（`src/lib/theme.ts`）
- 暗色玻璃拟态 UI，CSS 变量定义在 `src/app.css` 的 `:root`

## 技术栈与运行时

- Svelte 5，**runes 模式被强制开启**（`svelte.config.js` 中对非 `node_modules` 文件强制 `runes: true`），写组件时用 `$props()`、`$state`、`$derived`、`$effect`，不要用旧的 `export let` / `$:` 语法
- 适配器：`@sveltejs/adapter-node`（同样配置在 `svelte.config.js`），构建产物是独立 Node 服务（`node build` 启动）
- **注意**：kit ≥2.62 下若给 `vite.config.ts` 的 `sveltekit()` 传内联配置，`svelte.config.js` 会被**整个忽略**（仅一行警告）。本项目约定 SvelteKit/Svelte 配置只写在 `svelte.config.js`，`vite.config.ts` 仅保留 Vite 层配置（如 `server.host`）
- 唯一的运行时依赖是 `marked`（服务端把 Markdown 渲染成 HTML）
- 包管理器：**bun**（锁定文件为 `bun.lock`，`.npmrc` 设了 `engine-strict=true`）；本机无 npm，脚本一律用 `bun run` 调用
- 站点语言为中文，`src/app.html` 固定 `lang="zh-CN"`；暂不做 i18n

## 目录结构

```
content/posts/          博客文章（Markdown，运行时读取，不在构建产物内）
src/lib/server/posts.ts 博客核心：扫描目录、解析 frontmatter、渲染 Markdown（仅服务端）
src/lib/posts.ts        客户端/服务端共享的文章类型（PostMeta/PostsPage）与分页常量
src/lib/profile.ts      名片卡数据（头像、名字、链接）
src/lib/projects.ts     项目展示数据与分批渲染常量
src/lib/theme.ts        从背景图提取主题色的客户端逻辑
src/lib/components/     ProfileCard.svelte（常驻名片卡/导航栏）、InfiniteSentinel.svelte（无限滚动哨兵）
src/lib/assets/         背景图、favicon
src/routes/             SvelteKit 路由：+layout.svelte、+page.svelte、blog/、projects/、api/posts/（分页 JSON）
e2e/blog.e2e.ts         Playwright 端到端测试
static/                 静态文件（robots.txt）
svelte.config.js        adapter-node + 强制 runes（SvelteKit/Svelte 配置的唯一位置）
```

## 常用命令

```sh
bun install            # 安装依赖
bun run dev            # 开发服务器（监听 0.0.0.0）
bun run build          # 生产构建（输出到 build/）
bun run preview        # 预览生产构建（端口 4173）
bun run check          # svelte-check 类型检查
bun run lint           # prettier --check + eslint
bun run format         # prettier 自动格式化
bun run test           # 即 test:e2e：playwright install chromium && playwright test
```

## 博客内容系统（改这块前必读）

文章是 `content/posts/` 下的 Markdown 文件，**服务器每次请求时用 `node:fs` 扫描目录**（`src/lib/server/posts.ts` 的 `listPosts`/`getPost`），发文/改文/删文不需要重新构建或重启。约定：

- 文件名即 URL slug，只允许 `A-Za-z0-9_-`（`SLUG_PATTERN` 白名单，防路径穿越；`e2e` 测试覆盖了 `..%2F` 穿越返回 404）
- frontmatter 是**自实现的极简解析器**，只支持 `key: value` 和 `tags: [a, b]`；字段：`title`、`date`、`excerpt`、`tags`、`draft: true`（草稿不展示）。需要嵌套结构时才考虑换 yaml 解析器
- 目录可用环境变量 `CONTENT_DIR` 覆盖（`$env/dynamic/private`，运行时读取），缺省 `content/posts`（**相对进程 cwd**，部署时建议绝对路径）
- 以 `.` 开头的文件被跳过（兼容 rsync 临时文件和编辑器 swp）；单篇解析失败只跳过并 `console.warn`，不影响列表
- 文章 HTML 通过 `{@html}` 注入页面——这是刻意为之（站长自己的 Markdown、服务端渲染），已有 eslint-disable 注释说明
- 列表分页：`listPosts(offset, limit)` 返回 `{ posts, total }`（每页 `POSTS_PAGE_SIZE`）；`/blog` 首屏只 SSR 第一页，其余由客户端经 `/api/posts?offset=&limit=` 无限滚动拉取（哨兵组件 `InfiniteSentinel.svelte`，observer 的 root 取最近的滚动祖先）。项目页数据在 `src/lib/projects.ts`，同款哨兵做分批懒渲染
- panel 在桌面/移动端都是**固定尺寸**（`+layout.svelte` 两个 @media 分支），列表超高时在 panel 内部滚动——无限滚动依赖这一点，改布局时不要改回内容撑高

## 代码风格

- Prettier：**tab 缩进**、单引号、无尾逗号、行宽 100，`prettier-plugin-svelte` 处理 `.svelte`
- ESLint flat config：`js.configs.recommended` + `typescript-eslint` + `eslint-plugin-svelte` + prettier 兼容层；`no-undef` 关闭（TS 项目不需要）
- TypeScript `strict: true`，`checkJs: true`，`moduleResolution: bundler`；提交前跑 `bun run check` 和 `bun run lint`
- 代码注释、UI 文案、文档主要使用**中文**，新代码请保持一致
- 内部链接用 `$app/paths` 的 `resolve()`（eslint 规则 `svelte/no-navigation-without-resolve` 强制）；外部链接除外
- 路由切换的过渡动效依赖 layout 中的常驻锚点与 `{#key page.url.pathname}` 结构，改动 `+layout.svelte` / `ProfileCard.svelte` 时注意保留这一机制
- CSS 走暗色主题变量（`--accent`、`--panel`、`--panel-2`、`--muted`、`--border`），新样式复用这些变量和 `color-mix` 的既有写法

## 测试

- 只有 **Playwright 端到端测试**（`e2e/*.e2e.ts`），没有单元测试（刻意取舍）
- `playwright.config.ts` 的 webServer 会先 `bun run build` 再 `bun run preview`，测试跑在**生产构建**上（端口 4173）；只安装/使用 chromium（本机装全量浏览器会被 firefox/webkit 系统依赖卡住）
- 现有用例断言具体的中文文章标题（来自 `content/posts/` 下的三篇示例文章），增删示例文章会导致 e2e 失败，需同步更新 `e2e/blog.e2e.ts`
- 改完代码至少跑 `bun run check` + `bun run lint`；涉及博客逻辑或路由的改动再跑 `bun run test`

## 部署

```sh
bun run build
CONTENT_DIR=/srv/blog/posts PORT=3000 node build
```

- `CONTENT_DIR` 必须指向构建产物**之外**的持久目录（Docker 场景挂载卷），并使用绝对路径；重新部署应用不影响文章
- 内容发布是单向推送：`rsync -av --delete content/posts/ server:/srv/blog/posts/`（本地目录是唯一事实源；rsync 先写临时文件再重命名，请求不会读到写了一半的文件；`--delete` 同步下线已删文章）

## 安全注意事项

- slug 白名单 + `path.join` 是对路径穿越的防护，改动 `posts.ts` 时不要削弱这两层
- `CONTENT_DIR` 属于私密环境变量，只能通过 `$env/dynamic/private` 在服务端使用，不要导入到客户端代码（`$lib/server/` 下的模块本就禁止被客户端引用）
- 仓库无密钥管理需求；`.env` 类文件不会被提交
