import type { RedirectConfiguration } from "@/lib/redirects/types";

// Keep old public URLs here after changing a canonical route or article slug.
export const redirectsConfig = {
  paths: [
    { from: "/posts/en", to: "/en/posts/" },
    { from: "/posts/en/*", to: "/en/posts/:splat" },
    { from: "/archive/en/tag/*", to: "/en/tags/:splat" },
    { from: "/archive/tag/*", to: "/tags/:splat" },
    { from: "/archive/en", to: "/en/archives/" },
    { from: "/archive/en/*", to: "/en/archives/" },
    { from: "/archive", to: "/archives/" },
    { from: "/archive/*", to: "/archives/" },
    { from: "/about/en", to: "/en/about/" },
    { from: "/about/en/*", to: "/en/about/" },
    { from: "/books/:book/:chapter/", to: "/books/:book/" },
    { from: "/books/:book/:chapter", to: "/books/:book/" },
    { from: "/sitemap-index.xml", to: "/sitemap.xml" },
  ],
  postSlugs: [
    { from: "ai-agent-深度学习指南", to: "ai-agent-3114342e" },
    {
      from: "我做了一个把-anki-听力和-ai-阅读串起来的小插件-audio-wash-player",
      to: "anki-ai-audio-wash-player-32c4342e",
    },
    {
      from: "chromium-1187对应版本的playwright版本",
      to: "chromium-1187-playwright-2b54342e",
    },
    {
      from: "claude-code里面使用chatgpt的模型教程",
      to: "claude-code-chatgpt-34a4342e",
    },
    { from: "cloud-flare配置优选节点教程", to: "cloud-flare-2b34342e" },
    {
      from: "cloudflare-ai-gateway-自定义供应商配置与踩坑记录",
      to: "cloudflare-ai-gateway-3024342e",
    },
    {
      from: "cloudflare-ai-search-autorag-接入实战-个人博客的知识库ai助手",
      to: "cloudflare-ai-search-autorag-ai-2e74342e",
    },
    {
      from: "cloudflare-tunnel-实现国内未备案服务器通过域名访问",
      to: "cloudflare-tunnel-2f54342e",
    },
    {
      from: "cloudflare-worker反向代理网站教程",
      to: "cloudflare-worker-2ad4342e",
    },
    {
      from: "cloudflare-worker-反代服务器的ip出现403的解决办法",
      to: "cloudflare-worker-ip-403-2e94342e",
    },
    {
      from: "cloudflare-workers-ai-免费额度值多少钱",
      to: "cloudflare-workers-ai-3594342e",
    },
    {
      from: "nextdevtpl-一个面向独立开发者的-next-js-全栈-saas-模板",
      to: "nextdevtpl-next-js-saas-30b4342e",
    },
    {
      from: "开源自用的博客系统notion-fuwari",
      to: "notion-fuwari-3264342e",
    },
    {
      from: "pixiv爬虫-下载-代理-无需服务器即可一键部署",
      to: "pixiv-2a94342e",
    },
    { from: "pixiv爬虫常用api的文档汇总", to: "pixiv-api-2a94342e" },
    {
      from: "从-prompt-到-subagent-ai-工程化学习路线",
      to: "prompt-subagent-ai-36c4342e",
    },
    {
      from: "vercel项目国内访问慢-cf-worker反代-优选节点-无备案零成本极速访问",
      to: "vercel-cf-worker-2b34342e",
    },
    {
      from: "web-端实现-ai-内容流式传输与实时-markdown-渲染",
      to: "web-ai-markdown-2ae4342e",
    },
  ],
} as const satisfies RedirectConfiguration;
