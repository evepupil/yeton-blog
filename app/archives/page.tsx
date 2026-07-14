import { StaticPage } from "@/features/static-page/static-page";

export const metadata = { title: "文章归档" };

export default function ArchivesPage() {
  return (
    <StaticPage
      description="按时间回看写过的主题与长期关注的问题。"
      index="03"
      title="文章归档"
    />
  );
}
