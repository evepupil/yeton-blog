import { ArrowRight } from "lucide-react";
import { Link } from "@heroui/react/link";

export default function HomePage() {
  return (
    <main className="home-shell">
      <section className="intro" aria-labelledby="home-title">
        <p className="brand">林墨</p>
        <h1 id="home-title">写下代码之外，仍值得反复想的事。</h1>
        <p className="description">
          关于前端、AI 与独立开发，也记录一些慢下来的时刻。
        </p>
        <Link className="read-button" href="/posts/">
          阅读文章
          <ArrowRight aria-hidden="true" size={17} strokeWidth={1.8} />
        </Link>
      </section>
    </main>
  );
}
