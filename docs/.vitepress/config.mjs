import { defineConfig } from "vitepress";

const englishNav = [
  { text: "Constitution", link: "/constitution" },
  { text: "Export", link: "/export" },
  { text: "Website", link: "/website" },
];

const chineseNav = [
  { text: "宪法", link: "/zh/constitution" },
  { text: "导出", link: "/zh/export" },
  { text: "网站", link: "/zh/website" },
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
    zh: {
      label: "中文",
      lang: "zh-CN",
      link: "/zh/",
      themeConfig: {
        nav: chineseNav,
        sidebar: [
          { text: "概述", link: "/zh/" },
          ...chineseNav,
        ],
      },
    },
  },
});
