import Link from "next/link";

export default function NotFoundPage() {
  return (
    <main className="home-shell">
      <section className="intro" aria-labelledby="not-found-title">
        <p className="brand">404</p>
        <h1 id="not-found-title">这里还没有内容。</h1>
        <Link className="text-link" href="/">
          返回首页
        </Link>
      </section>
    </main>
  );
}
