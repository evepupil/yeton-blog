import type { Metadata } from "next";

import { NotFoundPage } from "@/features/not-found/not-found-page";
import { buildPageMetadata } from "@/lib/seo/metadata";

import "./globals.css";

const notFoundMetadata = buildPageMetadata({
  alternatePaths: { "zh-CN": "/404.html" },
  description: "这个地址没有对应的页面。",
  locale: "zh-CN",
  noIndex: true,
  pathname: "/404.html",
  title: "页面未找到",
});
export const metadata: Metadata = {
  ...notFoundMetadata,
  alternates: undefined,
  robots: undefined,
};

export default function GlobalNotFoundPage() {
  return (
    <html lang="zh-CN">
      <body>
        <NotFoundPage locale="zh-CN" />
      </body>
    </html>
  );
}
