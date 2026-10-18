[English](../website.md) | [简体中文](./website.md)

# 网站

正式网站是 <https://cortexharness.org>。

站点由这个 VitePress 项目生成。每次推送到 `main`，CI 都会用 `npm run docs:build` 构建静态文件。输出目录是 `docs/.vitepress/dist`。

该输出对应的 Cloudflare Pages 项目是 `cortexharness-org`，配置写在 `wrangler.toml`。本仓库只负责构建，不创建 Pages 项目，不修改 DNS，也不执行部署。

`cortexharness.ai` 为保留域名。它不是构建目标，也不承接本站。

英文和简体中文是两套 locale。导航上的语言菜单，以及每页顶部的 `English | 简体中文` 一行，用来在两者之间切换。
