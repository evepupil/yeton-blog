import GithubSlugger from "github-slugger";
import { toString } from "mdast-util-to-string";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import { unified } from "unified";
import { visit } from "unist-util-visit";

import type { ContentHeading } from "@/lib/content/types";

export interface MarkdownAnalysis {
  readonly headings: readonly ContentHeading[];
  readonly plainText: string;
}

export function analyzeMarkdown(markdown: string): MarkdownAnalysis {
  const tree = unified().use(remarkParse).use(remarkGfm).parse(markdown);
  const slugger = new GithubSlugger();
  const headings: ContentHeading[] = [];

  visit(tree, "heading", (node) => {
    if (node.depth !== 2 && node.depth !== 3) {
      return;
    }

    const text = toString(node).trim();
    if (!text) {
      return;
    }

    headings.push({
      depth: node.depth,
      id: slugger.slug(text),
      text,
    });
  });

  return {
    headings,
    plainText: toString(tree).replace(/\s+/gu, " ").trim(),
  };
}
