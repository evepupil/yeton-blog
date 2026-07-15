import { createHash } from "node:crypto";
import { mkdir, readdir, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";

import remarkParse from "remark-parse";
import { unified } from "unified";
import { visit } from "unist-util-visit";

const maximumImageBytes = 10 * 1024 * 1024;
const contentTypeExtensions = new Map([
  ["image/avif", "avif"],
  ["image/gif", "gif"],
  ["image/jpeg", "jpg"],
  ["image/jpg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
]);
const allowedExtensions = new Set(contentTypeExtensions.values());

export interface DownloadedImage {
  readonly bytes: Uint8Array;
  readonly extension: string;
}

export type ImageFetcher = (url: string) => Promise<DownloadedImage>;

function extensionFromUrl(url: string): string | undefined {
  const extension = path.extname(new URL(url).pathname).slice(1).toLowerCase();
  if (extension === "jpeg") return "jpg";
  return allowedExtensions.has(extension) ? extension : undefined;
}

export function resolveImageExtension(
  url: string,
  contentType: string | null,
): string {
  const normalizedContentType = contentType
    ?.split(";", 1)[0]
    ?.trim()
    .toLowerCase();
  const contentTypeExtension = normalizedContentType
    ? contentTypeExtensions.get(normalizedContentType)
    : undefined;
  if (
    normalizedContentType &&
    normalizedContentType !== "application/octet-stream" &&
    !contentTypeExtension
  ) {
    throw new Error(
      `Unsupported image content type: ${normalizedContentType}.`,
    );
  }
  const extension = contentTypeExtension ?? extensionFromUrl(url);
  if (!extension) {
    throw new Error(`Unsupported image type from ${new URL(url).origin}.`);
  }
  return extension;
}

function bytesEqual(
  bytes: Uint8Array,
  offset: number,
  expected: readonly number[],
): boolean {
  return expected.every((value, index) => bytes[offset + index] === value);
}

function validateImageBytes(bytes: Uint8Array, extension: string) {
  const valid = (() => {
    switch (extension) {
      case "jpg":
        return bytesEqual(bytes, 0, [0xff, 0xd8, 0xff]);
      case "png":
        return bytesEqual(bytes, 0, [0x89, 0x50, 0x4e, 0x47]);
      case "gif":
        return bytesEqual(bytes, 0, [0x47, 0x49, 0x46, 0x38]);
      case "webp":
        return (
          bytesEqual(bytes, 0, [0x52, 0x49, 0x46, 0x46]) &&
          bytesEqual(bytes, 8, [0x57, 0x45, 0x42, 0x50])
        );
      case "avif": {
        const header = new TextDecoder("ascii").decode(bytes.slice(0, 64));
        return header.slice(4, 8) === "ftyp" && /avi[fs]/u.test(header);
      }
      default:
        return false;
    }
  })();

  if (!valid) {
    throw new Error(`Downloaded file is not a valid ${extension} image.`);
  }
}

async function readLimitedBody(response: Response): Promise<Uint8Array> {
  if (!response.body) {
    throw new Error("Image response has no body.");
  }

  const contentLength = Number(response.headers.get("content-length") ?? 0);
  if (contentLength > maximumImageBytes) {
    throw new Error("Remote image exceeds the 10 MB limit.");
  }

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  while (true) {
    const result = await reader.read();
    if (result.done) break;
    totalBytes += result.value.byteLength;
    if (totalBytes > maximumImageBytes) {
      await reader.cancel();
      throw new Error("Remote image exceeds the 10 MB limit.");
    }
    chunks.push(result.value);
  }

  const bytes = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return bytes;
}

export async function fetchRemoteImage(url: string): Promise<DownloadedImage> {
  const parsedUrl = new URL(url);
  if (!new Set(["http:", "https:"]).has(parsedUrl.protocol)) {
    throw new Error(`Image URL must use http or https: ${url}`);
  }

  const response = await fetch(parsedUrl, {
    redirect: "follow",
    signal: AbortSignal.timeout(30_000),
    headers: { "User-Agent": "hero-ui-blog-notion-sync/1.0" },
  });
  if (!response.ok) {
    throw new Error(`Image download failed with HTTP ${response.status}.`);
  }

  const extension = resolveImageExtension(
    response.url || parsedUrl.href,
    response.headers.get("content-type"),
  );
  const bytes = await readLimitedBody(response);
  validateImageBytes(bytes, extension);
  return { bytes, extension };
}

async function saveImage(
  directory: string,
  baseName: string,
  image: DownloadedImage,
): Promise<string> {
  const filename = `${baseName}.${image.extension}`;
  await writeFile(path.join(directory, filename), image.bytes);
  return filename;
}

function escapeImageAlt(value: string): string {
  return value.replaceAll("\\", "\\\\").replaceAll("]", "\\]");
}

async function rewriteMarkdownImages(
  markdown: string,
  slug: string,
  directory: string,
  fetchImage: ImageFetcher,
): Promise<string> {
  const tree = unified().use(remarkParse).parse(markdown);
  const remoteImages: Array<{
    alt: string;
    end: number;
    start: number;
    url: string;
  }> = [];

  visit(tree, "image", (node) => {
    if (!/^https?:\/\//u.test(node.url)) return;
    const start = node.position?.start.offset;
    const end = node.position?.end.offset;
    if (start === undefined || end === undefined) {
      throw new Error("Markdown image is missing source offsets.");
    }
    remoteImages.push({ alt: node.alt ?? "", end, start, url: node.url });
  });

  const replacements: Array<{ end: number; start: number; value: string }> = [];
  const downloadedUrls = new Map<string, string>();

  for (const image of remoteImages) {
    let filename = downloadedUrls.get(image.url);
    if (!filename) {
      filename = await saveImage(
        directory,
        `image-${downloadedUrls.size + 1}`,
        await fetchImage(image.url),
      );
      downloadedUrls.set(image.url, filename);
    }
    replacements.push({
      end: image.end,
      start: image.start,
      value: `![${escapeImageAlt(image.alt)}](/images/notion/${slug}/${filename})`,
    });
  }

  return replacements
    .toSorted((left, right) => right.start - left.start)
    .reduce(
      (result, replacement) =>
        `${result.slice(0, replacement.start)}${replacement.value}${result.slice(replacement.end)}`,
      markdown,
    );
}

async function replaceDirectory(
  temporaryDirectory: string,
  destinationDirectory: string,
) {
  const entries = await readdir(temporaryDirectory);
  await rm(destinationDirectory, { force: true, recursive: true });
  if (entries.length === 0) {
    await rm(temporaryDirectory, { force: true, recursive: true });
    return;
  }
  await mkdir(path.dirname(destinationDirectory), { recursive: true });
  await rename(temporaryDirectory, destinationDirectory);
}

export async function prepareArticleAssets(
  article: {
    readonly body: string;
    readonly coverUrl?: string;
    readonly slug: string;
  },
  publicRoot: string,
  fetchImage: ImageFetcher = fetchRemoteImage,
): Promise<{ body: string; coverPath?: string }> {
  const destination = path.join(publicRoot, "images", "notion", article.slug);
  const temporary = `${destination}.sync-${process.pid}`;
  await rm(temporary, { force: true, recursive: true });
  await mkdir(temporary, { recursive: true });

  try {
    const body = await rewriteMarkdownImages(
      article.body,
      article.slug,
      temporary,
      fetchImage,
    );
    let coverPath: string | undefined;
    if (article.coverUrl) {
      const filename = await saveImage(
        temporary,
        "cover",
        await fetchImage(article.coverUrl),
      );
      coverPath = `/images/notion/${article.slug}/${filename}`;
    }
    await replaceDirectory(temporary, destination);
    return { body, coverPath };
  } catch (error) {
    await rm(temporary, { force: true, recursive: true });
    throw error;
  }
}

export function createFriendAvatarBaseName(friendUrl: string): string {
  const hash = createHash("sha256")
    .update(friendUrl)
    .digest("hex")
    .slice(0, 12);
  return `friend-${hash}`;
}

export async function prepareFriendAvatars<
  T extends { readonly avatarUrl?: string; readonly url: string },
>(
  friends: readonly T[],
  publicRoot: string,
  fetchImage: ImageFetcher = fetchRemoteImage,
): Promise<Array<Omit<T, "avatarUrl"> & { avatar?: string }>> {
  const destination = path.join(publicRoot, "images", "friends");
  const temporary = `${destination}.sync-${process.pid}`;
  await rm(temporary, { force: true, recursive: true });
  await mkdir(temporary, { recursive: true });

  try {
    const localized = [];
    for (const friend of friends) {
      const { avatarUrl, ...details } = friend;
      if (!avatarUrl) {
        localized.push(details);
        continue;
      }
      const filename = await saveImage(
        temporary,
        createFriendAvatarBaseName(friend.url),
        await fetchImage(avatarUrl),
      );
      localized.push({ ...details, avatar: `/images/friends/${filename}` });
    }
    await replaceDirectory(temporary, destination);
    return localized;
  } catch (error) {
    await rm(temporary, { force: true, recursive: true });
    throw error;
  }
}
