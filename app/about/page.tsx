import { StaticPage } from "@/features/static-page/static-page";

export const metadata = { title: "关于林墨" };

export default function AboutPage() {
  return (
    <StaticPage
      description="独立开发者，也是一名长期写作者。"
      index="05"
      title="关于林墨"
    />
  );
}
