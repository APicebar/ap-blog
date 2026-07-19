---
title: 我的博客其实是一堆 Markdown
date: '2026-05-30'
excerpt: 没有数据库，没有后台，服务器在请求时把目录扫一遍就完事了。
tags: [博客]
---

这个博客没有数据库，也没有后台管理界面。所有文章都是服务器上一个目录里的 Markdown 文件。

每次请求时用 `node:fs` 把目录扫一遍，frontmatter 解析出标题和日期，正文交给 Markdown 渲染器：

```ts
const files = await readdir(CONTENT_DIR);
const posts = files.filter((f) => f.endsWith('.md'));
```

写作流程就是本地写完一篇，`rsync` 推到服务器，刷新页面就能看到——不用重新构建，也不用重启进程。对一个人维护的站点来说，没有比这更省心的架构了。
