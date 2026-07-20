import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const MAX_COVER_BYTES = 5 * 1024 * 1024;
const allowedExtensions = new Set(["avif", "gif", "jpg", "png", "webp"]);
const contentTypeExtensions = new Map([
  ["image/avif", "avif"],
  ["image/gif", "gif"],
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
]);

interface DownloadCoverOptions {
  readonly author: string;
  readonly fetcher?: typeof fetch;
  readonly sourceUrl: string;
  readonly targetDirectory: string;
  readonly title: string;
}

function parseRemoteUrl(value: string): URL {
  const url = new URL(value);
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("微信读书封面地址必须使用 HTTP 或 HTTPS");
  }
  return url;
}

export function createCoverBaseName(title: string, author: string): string {
  return createHash("sha256")
    .update(`${title}\u0000${author}`)
    .digest("hex")
    .slice(0, 16);
}

export function resolveCoverExtension(
  contentType: string | null,
  sourceUrl: string,
): string {
  const normalizedContentType = contentType?.split(";", 1)[0]?.trim();
  const fromContentType = normalizedContentType
    ? contentTypeExtensions.get(normalizedContentType)
    : undefined;
  if (fromContentType) return fromContentType;

  const extension = path
    .extname(parseRemoteUrl(sourceUrl).pathname)
    .slice(1)
    .toLowerCase()
    .replace("jpeg", "jpg");
  if (allowedExtensions.has(extension)) return extension;

  throw new Error("微信读书封面没有可识别的图片格式");
}

export async function downloadReadingCover(
  options: DownloadCoverOptions,
): Promise<string> {
  const sourceUrl = parseRemoteUrl(options.sourceUrl);
  const fetcher = options.fetcher ?? fetch;
  const response = await fetcher(sourceUrl, {
    headers: { Accept: "image/avif,image/webp,image/*" },
    signal: AbortSignal.timeout(15_000),
  });

  if (!response.ok) {
    throw new Error(
      `微信读书封面下载失败：${sourceUrl.origin}，HTTP ${response.status}`,
    );
  }

  const declaredLength = Number(response.headers.get("content-length"));
  if (Number.isFinite(declaredLength) && declaredLength > MAX_COVER_BYTES) {
    throw new Error("微信读书封面超过 5 MB 限制");
  }

  const bytes = new Uint8Array(await response.arrayBuffer());
  if (bytes.length === 0 || bytes.length > MAX_COVER_BYTES) {
    throw new Error("微信读书封面为空或超过 5 MB 限制");
  }

  const extension = resolveCoverExtension(
    response.headers.get("content-type"),
    sourceUrl.href,
  );
  const fileName = `${createCoverBaseName(options.title, options.author)}.${extension}`;
  await mkdir(options.targetDirectory, { recursive: true });
  await writeFile(path.join(options.targetDirectory, fileName), bytes);
  return `/images/reading/${fileName}`;
}
