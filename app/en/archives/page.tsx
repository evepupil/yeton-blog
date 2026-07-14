import { StaticPage } from "@/features/static-page/static-page";

export const metadata = { title: "Archive" };

export default function EnglishArchivesPage() {
  return (
    <StaticPage
      description="A chronological view of recurring topics and unfinished questions."
      index="03"
      title="Archive"
    />
  );
}
