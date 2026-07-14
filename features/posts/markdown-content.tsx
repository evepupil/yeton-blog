import rehypeSlug from "rehype-slug";
import ReactMarkdown from "react-markdown";

interface MarkdownContentProps {
  readonly markdown: string;
}

export function MarkdownContent({ markdown }: MarkdownContentProps) {
  return (
    <div className="article-prose">
      <ReactMarkdown rehypePlugins={[rehypeSlug]}>{markdown}</ReactMarkdown>
    </div>
  );
}
