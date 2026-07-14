import { StaticPage } from "@/features/static-page/static-page";

export const metadata = { title: "Writing" };

export default function EnglishPostsPage() {
  return (
    <StaticPage
      description="Engineering notes and product thinking, written at a sustainable pace."
      index="02"
      title="All writing"
    />
  );
}
