import { StaticPage } from "@/features/static-page/static-page";

export const metadata = { title: "所有文章" };

export default function PostsPage() {
  return (
    <StaticPage
      description="从工程实践到产品思考，按自己的节奏持续记录。"
      index="02"
      title="所有文章"
    />
  );
}
