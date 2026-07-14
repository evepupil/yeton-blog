import { ArrowLeft } from "lucide-react";
import { Link } from "@heroui/react/link";

export const metadata = {
  title: "所有文章",
};

export default function PostsPage() {
  return (
    <main className="home-shell">
      <section className="intro" aria-labelledby="posts-title">
        <p className="brand">文章</p>
        <h1 id="posts-title">所有文章</h1>
        <p className="description">
          从工程实践到产品思考，按自己的节奏持续记录。
        </p>
        <Link className="text-link" href="/">
          <ArrowLeft aria-hidden="true" size={16} strokeWidth={1.8} />
          返回首页
        </Link>
      </section>
    </main>
  );
}
