import { PageIntro } from "@/components/page/page-intro";
import { SiteLink } from "@/components/ui/site-link";

export default function NotFoundPage() {
  return (
    <main className="shell static-page">
      <PageIntro
        description="这个地址没有对应的页面。"
        index="404"
        title="这里还没有内容。"
      />
      <SiteLink className="text-link" href="/">
        返回首页
      </SiteLink>
    </main>
  );
}
