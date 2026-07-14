import { StaticPage } from "@/features/static-page/static-page";

export const metadata = { title: "Books and long reads" };

export default function EnglishBooksPage() {
  return (
    <StaticPage
      description="Structured notes for subjects that deserve chapter-by-chapter reading."
      index="04"
      title="Books and long reads"
    />
  );
}
