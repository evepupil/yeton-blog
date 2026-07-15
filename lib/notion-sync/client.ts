import { Client, isFullPage, type PageObjectResponse } from "@notionhq/client";
import { NotionToMarkdown } from "notion-to-md";

export interface NotionContentSource {
  listApprovedFriends(databaseId: string): Promise<PageObjectResponse[]>;
  listPublishedArticles(
    databaseId: string,
    status: string,
  ): Promise<PageObjectResponse[]>;
  renderArticle(pageId: string): Promise<string>;
}

type DatabaseQueryResponse = Awaited<ReturnType<Client["databases"]["query"]>>;

async function collectPages(
  query: (cursor?: string) => Promise<DatabaseQueryResponse>,
): Promise<PageObjectResponse[]> {
  const pages: PageObjectResponse[] = [];
  let cursor: string | undefined;

  do {
    const response = await query(cursor);
    pages.push(...response.results.filter(isFullPage));
    cursor = response.has_more
      ? (response.next_cursor ?? undefined)
      : undefined;
  } while (cursor);

  return pages;
}

export class NotionApiContentSource implements NotionContentSource {
  readonly #client: Client;
  readonly #markdown: NotionToMarkdown;

  constructor(token: string) {
    this.#client = new Client({ auth: token });
    this.#markdown = new NotionToMarkdown({ notionClient: this.#client });
  }

  listPublishedArticles(databaseId: string, status: string) {
    return collectPages((start_cursor) =>
      this.#client.databases.query({
        database_id: databaseId,
        start_cursor,
        filter: { property: "Status", status: { equals: status } },
        sorts: [{ property: "Published Date", direction: "descending" }],
      }),
    );
  }

  listApprovedFriends(databaseId: string) {
    return collectPages((start_cursor) =>
      this.#client.databases.query({
        database_id: databaseId,
        start_cursor,
        filter: { property: "状态", select: { equals: "已通过" } },
        sorts: [{ property: "提交时间", direction: "descending" }],
      }),
    );
  }

  async renderArticle(pageId: string): Promise<string> {
    const blocks = await this.#markdown.pageToMarkdown(pageId);
    return (this.#markdown.toMarkdownString(blocks).parent ?? "").trim();
  }
}
