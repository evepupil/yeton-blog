import { BooksPage } from "@/features/books/books-page";

export const metadata = { title: "Books and long reads" };

export default function EnglishBooksPage() {
  return <BooksPage locale="en" />;
}
