import type { ContentHeading } from "@/lib/content/types";

interface ArticleTocProps {
  readonly headings: readonly ContentHeading[];
  readonly title: string;
}

export function ArticleToc({ headings, title }: ArticleTocProps) {
  if (headings.length === 0) {
    return null;
  }

  return (
    <aside aria-label={title} className="article-toc">
      <strong>{title}</strong>
      <ol>
        {headings.map((heading) => (
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
