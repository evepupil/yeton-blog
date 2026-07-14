import { StaticPage } from "@/features/static-page/static-page";

export const metadata = { title: "图书与长文" };

export default function BooksPage() {
  return (
    <StaticPage
      description="把适合系统学习的内容整理成可以逐章阅读的书。"
      index="04"
      title="图书与长文"
    />
  );
}
