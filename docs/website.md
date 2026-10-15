# Website

The canonical website is <https://cortexharness.org>.

The site is this VitePress project. On every push to `main`, CI builds the
static files with `npm run docs:build`. The output directory is
`docs/.vitepress/dist`.

The Cloudflare Pages project for that output is `cortexharness-org`, configured
in `wrangler.toml`. This repository builds the site. It does not create the
Pages project, change DNS, or deploy.

`cortexharness.ai` is reserved. It is not a build target and it does not
receive this site.
