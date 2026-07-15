import type { ContentHeading } from "@/lib/content/types";
import { getArticleTocHeadings } from "@/lib/content/toc";

interface ArticleTocProps {
  readonly headings: readonly ContentHeading[];
  readonly title: string;
}

export function ArticleToc({ headings, title }: ArticleTocProps) {
  const visibleHeadings = getArticleTocHeadings(headings);
  if (visibleHeadings.length === 0) {
    return null;
  }

  return (
    <aside aria-label={title} className="article-toc">
      <strong>{title}</strong>
      <ol>
        {visibleHeadings.map((heading) => (
          <li
            className={heading.depth === 3 ? "is-nested" : undefined}
            key={heading.id}
          >
            <a href={`#${heading.id}`}>{heading.text}</a>
          </li>
        ))}
      </ol>
    </aside>
  );
}
