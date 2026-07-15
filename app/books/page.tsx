import { BooksPage as BooksPageView } from "@/features/books/books-page";

export const metadata = { title: "图书与长文" };

export default function BooksPage() {
  return <BooksPageView locale="zh-CN" />;
}
