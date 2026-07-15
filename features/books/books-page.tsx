import { PageIntro } from "@/components/page/page-intro";
import { BookCard } from "@/features/books/book-card";
import { booksContent } from "@/features/books/book-content";
import { getPublishedBooks } from "@/lib/content/queries";
import { getAllBooks } from "@/lib/content/repository";
import type { SiteLocale } from "@/lib/site-config";

interface BooksPageProps {
  readonly locale: SiteLocale;
}

export async function BooksPage({ locale }: BooksPageProps) {
  const content = booksContent[locale];
  const books = getPublishedBooks(await getAllBooks(), locale);

  return (
    <main className="shell books-page">
      <PageIntro
        description={content.description}
        index="04"
        title={content.title}
      />
      <div className="book-list">
        {books.map((book, index) => (
          <BookCard book={book} index={index} key={book.slug} />
        ))}
      </div>
    </main>
  );
}
