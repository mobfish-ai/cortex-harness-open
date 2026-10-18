import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitepress";

const here = dirname(fileURLToPath(import.meta.url));
const chinese = JSON.parse(readFileSync(join(here, "../zh-CN/locale.json"), "utf8"));

const englishNav = [
  { text: "Constitution", link: "/constitution" },
  { text: "Export", link: "/export" },
  { text: "Website", link: "/website" },
];

export default defineConfig({
  title: "Cortex Harness",
  description: "Open protocol and reference documentation for Cortex Harness.",
  cleanUrls: true,
  locales: {
    root: {
      label: "English",
      lang: "en-US",
      themeConfig: {
        nav: englishNav,
        sidebar: [
          { text: "Overview", link: "/" },
          ...englishNav,
        ],
      },
    },
    "zh-CN": {
      label: chinese.label,
      lang: "zh-CN",
      link: "/zh-CN/",
      themeConfig: {
        nav: chinese.nav,
        sidebar: [
          { text: chinese.overview, link: "/zh-CN/" },
          ...chinese.nav,
        ],
      },
    },
  },
});
