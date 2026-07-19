# ap-blog

个人主页 + 博客站点：SvelteKit 2 + Svelte 5（runes）+ TypeScript。博文是文件系统上的 Markdown，运行时扫描、无数据库。项目由 `../demo` 原型规范化迁移而来（详见 `AGENTS.md`）。

## 开发

```sh
bun install
bun run dev            # 开发服务器（监听 0.0.0.0）
```

## 构建与预览

```sh
bun run build          # 生产构建（adapter-node，输出到 build/）
bun run preview        # 预览生产构建（端口 4173）
```

## 文章目录与同步

博文是 `content/posts/` 下的 Markdown 文件，**服务器在每次请求时扫描该目录**——发文/改文/删文都不需要重新构建或重启进程。

- 文件名即 URL slug，只允许 `A-Za-z0-9_-`（如 `hello-world.md` → `/blog/hello-world`）
- frontmatter 支持 `title`、`date`、`excerpt`、`tags: [a, b]`，以及 `draft: true`（草稿不在前台展示）
- 目录路径可用环境变量 `CONTENT_DIR` 覆盖，缺省为工作目录下的 `content/posts`

发布流程（本地目录是唯一事实源，单向推送）：

```sh
rsync -av --delete content/posts/ server:/srv/blog/posts/
```

rsync 先写临时文件再重命名，请求不会读到写了一半的文章；`--delete` 让本地删除的文章同步下线。

## 部署

项目使用 adapter-node，构建产物是一个独立 Node 服务：

```sh
bun run build
CONTENT_DIR=/srv/blog/posts PORT=3000 node build
```

注意 `CONTENT_DIR` 要指向构建产物之外的持久目录（Docker 部署时挂载卷），且建议使用**绝对路径**（缺省值 `content/posts` 是相对进程工作目录解析的），重新部署应用不影响文章内容。

## 测试

```sh
bun run check          # svelte-check 类型检查
bun run lint           # prettier --check + eslint
bun run test           # Playwright e2e（自动 build + preview，仅用 chromium）
```
