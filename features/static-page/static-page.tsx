import { PageIntro } from "@/components/page/page-intro";

interface StaticPageProps {
  readonly description: string;
  readonly index: string;
  readonly title: string;
}

export function StaticPage({ description, index, title }: StaticPageProps) {
  return (
    <main className="shell static-page">
      <PageIntro description={description} index={index} title={title} />
    </main>
  );
}
