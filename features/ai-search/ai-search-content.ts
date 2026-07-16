import type { AiSearchErrorCode } from "@/lib/ai-search/types";
import type { SiteLocale } from "@/lib/site-config";

interface AiSearchCopy {
  readonly assistantLabel: string;
  readonly close: string;
  readonly errors: Readonly<Record<AiSearchErrorCode, string>>;
  readonly inputLabel: string;
  readonly launcher: string;
  readonly placeholder: string;
  readonly retry: string;
  readonly send: string;
  readonly sources: string;
  readonly stop: string;
  readonly stopped: string;
  readonly title: string;
  readonly userLabel: string;
  readonly welcome: string;
}

export const aiSearchContent = {
  "zh-CN": {
    assistantLabel: "AI 助手",
    close: "关闭 AI 搜索",
    errors: {
      INVALID_REQUEST: "请求格式有误，请重新输入。",
      NO_CITATIONS: "没有找到足够可靠的站内来源，请换个问法。",
      ORIGIN_NOT_ALLOWED: "当前页面无法发起这次请求。",
      QUERY_REQUIRED: "请输入问题。",
      QUERY_TOO_LONG: "问题太长，请精简后重试。",
      RATE_LIMITED: "请求有些频繁，请稍后再试。",
      SERVICE_UNAVAILABLE: "AI 搜索暂时不可用。",
      UPSTREAM_ERROR: "AI 搜索响应异常，请稍后重试。",
      UPSTREAM_TIMEOUT: "AI 搜索响应超时，请稍后重试。",
    },
    inputLabel: "向 AI 搜索提问",
    launcher: "打开 AI 搜索",
    placeholder: "搜索站内文章…",
    retry: "重试",
    send: "发送问题",
    sources: "引用文章",
    stop: "停止生成",
    stopped: "已停止生成",
    title: "AI 搜索",
    userLabel: "你",
    welcome: "想查哪篇文章或哪个主题？",
  },
  en: {
    assistantLabel: "AI assistant",
    close: "Close AI search",
    errors: {
      INVALID_REQUEST: "The request could not be read. Please try again.",
      NO_CITATIONS: "No reliable on-site sources were found. Try rephrasing.",
      ORIGIN_NOT_ALLOWED: "This page cannot make the request.",
      QUERY_REQUIRED: "Enter a question.",
      QUERY_TOO_LONG: "The question is too long. Please shorten it.",
      RATE_LIMITED: "Too many requests. Please try again shortly.",
      SERVICE_UNAVAILABLE: "AI search is temporarily unavailable.",
      UPSTREAM_ERROR: "AI search returned an invalid response. Try again.",
      UPSTREAM_TIMEOUT: "AI search took too long. Please try again.",
    },
    inputLabel: "Ask AI search",
    launcher: "Open AI search",
    placeholder: "Search the writing…",
    retry: "Retry",
    send: "Send question",
    sources: "Sources",
    stop: "Stop generating",
    stopped: "Generation stopped",
    title: "AI Search",
    userLabel: "You",
    welcome: "Which article or topic are you looking for?",
  },
} as const satisfies Record<SiteLocale, AiSearchCopy>;
