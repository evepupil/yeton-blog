import rehypeSlug from "rehype-slug";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface MarkdownContentProps {
  readonly markdown: string;
}

export function MarkdownContent({ markdown }: MarkdownContentProps) {
  return (
    <div className="article-prose">
      <ReactMarkdown rehypePlugins={[rehypeSlug]} remarkPlugins={[remarkGfm]}>
        {markdown}
      </ReactMarkdown>
    </div>
  );
}
