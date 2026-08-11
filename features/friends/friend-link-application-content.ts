import type { FriendLinkApplicationFailureCode } from "@/lib/friends/application";
import type { SiteLocale } from "@/lib/site-config";

interface FriendLinkApplicationContent {
  readonly applyAction: string;
  readonly applyDescription: string;
  readonly applyTitle: string;
  readonly avatar: string;
  readonly avatarPlaceholder: string;
  readonly cancel: string;
  readonly close: string;
  readonly description: string;
  readonly descriptionPlaceholder: string;
  readonly errors: Readonly<Record<FriendLinkApplicationFailureCode, string>>;
  readonly name: string;
  readonly namePlaceholder: string;
  readonly optional: string;
  readonly submit: string;
  readonly submitted: string;
  readonly submitting: string;
  readonly title: string;
  readonly url: string;
  readonly urlPlaceholder: string;
}

export const friendLinkApplicationContent = {
  "zh-CN": {
    applyAction: "申请友链",
    applyDescription: "提交后会进入 Notion 待审核列表，通过后随站点同步公开。",
    applyTitle: "交换一个站点链接",
    avatar: "头像地址",
    avatarPlaceholder: "https://example.com/avatar.png",
    cancel: "取消",
    close: "关闭友链申请",
    description: "网站描述",
    descriptionPlaceholder: "用一句话介绍你的网站",
    errors: {
      INVALID_REQUEST: "请检查填写内容后再提交。",
      ORIGIN_NOT_ALLOWED: "当前页面无法提交申请。",
      RATE_LIMITED: "提交次数有些频繁，请稍后再试。",
      SERVICE_UNAVAILABLE: "申请服务暂时未配置好，请稍后再试。",
      UPSTREAM_ERROR: "申请暂时没有提交成功，请稍后重试。",
    },
    name: "网站名称",
    namePlaceholder: "例如：我的个人博客",
    optional: "可选",
    submit: "提交申请",
    submitted: "申请已提交，等待审核。",
    submitting: "提交中",
    title: "申请友链",
    url: "网站地址",
    urlPlaceholder: "https://example.com",
  },
  en: {
    applyAction: "Apply for a link",
    applyDescription:
      "Your submission enters a pending Notion review and appears after approval and synchronization.",
    applyTitle: "Exchange a site link",
    avatar: "Avatar URL",
    avatarPlaceholder: "https://example.com/avatar.png",
    cancel: "Cancel",
    close: "Close friend-link application",
    description: "Site description",
    descriptionPlaceholder: "Describe your site in one sentence",
    errors: {
      INVALID_REQUEST: "Check the fields and try again.",
      ORIGIN_NOT_ALLOWED: "This page cannot submit the application.",
      RATE_LIMITED: "Too many submissions. Please try again later.",
      SERVICE_UNAVAILABLE: "The application service is not configured yet.",
      UPSTREAM_ERROR: "The application was not submitted. Please try again.",
    },
    name: "Site name",
    namePlaceholder: "For example: My personal blog",
    optional: "optional",
    submit: "Submit application",
    submitted: "Application submitted and waiting for review.",
    submitting: "Submitting",
    title: "Apply for a friend link",
    url: "Site URL",
    urlPlaceholder: "https://example.com",
  },
} as const satisfies Record<SiteLocale, FriendLinkApplicationContent>;
