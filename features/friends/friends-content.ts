import type { SiteLocale } from "@/lib/site-config";

export const friendsContent = {
  "zh-CN": {
    avatarAlt: (name: string) => `${name} 的头像`,
    count: (count: number) => `${count} 个站点`,
    emptyDescription: "同步完成后，友链会显示在这里。",
    emptyTitle: "这里还没有友链",
    listLabel: "友链列表",
    title: "友链",
    visit: (name: string) => `访问 ${name}`,
  },
  en: {
    avatarAlt: (name: string) => `${name} avatar`,
    count: (count: number) => `${count} ${count === 1 ? "site" : "sites"}`,
    emptyDescription: "Friend links will appear here after synchronization.",
    emptyTitle: "No friend links yet",
    listLabel: "Friend links",
    title: "Friends",
    visit: (name: string) => `Visit ${name}`,
  },
} as const satisfies Record<SiteLocale, object>;
