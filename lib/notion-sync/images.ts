import { createHash } from "node:crypto";
import { mkdir, readdir, rename, rm, writeFile } from "node:fs/promises";
import http, { type IncomingMessage } from "node:http";
import https from "node:https";
import path from "node:path";

import remarkParse from "remark-parse";
import { unified } from "unified";
import { visit } from "unist-util-visit";

import {
  silentSyncReporter,
  type SyncReporter,
} from "@/lib/notion-sync/reporter";

const maximumImageBytes = 10 * 1024 * 1024;
const maximumRedirects = 5;
const requestTimeoutMilliseconds = 30_000;
const allowedImageProtocols = new Set(["http:", "https:"]);
const redirectStatuses = new Set([301, 302, 303, 307, 308]);
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

function readHeader(
  response: IncomingMessage,
  name: "content-length" | "content-type",
): string | undefined {
  const value = response.headers[name];
  return Array.isArray(value) ? value[0] : value;
}

async function readLimitedBody(response: IncomingMessage): Promise<Uint8Array> {
  const contentLength = Number(readHeader(response, "content-length") ?? 0);
  if (Number.isFinite(contentLength) && contentLength > maximumImageBytes) {
    response.destroy();
    throw new Error("Remote image exceeds the 10 MB limit.");
  }

  const chunks: Buffer[] = [];
  let totalBytes = 0;

  for await (const chunk of response) {
    const bytes = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    totalBytes += bytes.byteLength;
    if (totalBytes > maximumImageBytes) {
      response.destroy();
      throw new Error("Remote image exceeds the 10 MB limit.");
    }
    chunks.push(bytes);
  }

  return new Uint8Array(Buffer.concat(chunks, totalBytes));
}

interface ImageResponse {
  readonly response: IncomingMessage;
  readonly url: URL;
}

function requestImage(
  url: URL,
  redirectsRemaining: number,
): Promise<ImageResponse> {
  return new Promise((resolve, reject) => {
    const transport = url.protocol === "https:" ? https : http;
    const request = transport.get(url, (response) => {
      const status = response.statusCode ?? 0;
      if (redirectStatuses.has(status)) {
        const location = response.headers.location;
        response.resume();
        if (!location) {
          reject(
            new Error(`Image redirect from ${url.origin} has no location.`),
          );
          return;
        }
        if (redirectsRemaining === 0) {
          reject(
            new Error(`Image download from ${url.origin} exceeded redirects.`),
          );
          return;
        }
        let redirectUrl: URL;
        try {
          redirectUrl = new URL(location, url);
        } catch {
          reject(
            new Error(
              `Image redirect from ${url.origin} has invalid location.`,
            ),
          );
          return;
        }
        if (!allowedImageProtocols.has(redirectUrl.protocol)) {
          reject(
            new Error(
              `Image redirect from ${url.origin} must use HTTP or HTTPS.`,
            ),
          );
          return;
        }
        requestImage(redirectUrl, redirectsRemaining - 1).then(resolve, reject);
        return;
      }

      if (status !== 200) {
        response.resume();
        reject(
          new Error(
            `Image download from ${url.origin} failed with HTTP ${status}.`,
          ),
        );
        return;
      }
      resolve({ response, url });
    });

    request.setTimeout(requestTimeoutMilliseconds, () => {
      request.destroy(new Error("Image download timed out after 30 seconds."));
    });
    request.once("error", reject);
  });
}

export async function fetchRemoteImage(url: string): Promise<DownloadedImage> {
  const parsedUrl = new URL(url);
  if (!allowedImageProtocols.has(parsedUrl.protocol)) {
    throw new Error(`Image URL must use http or https: ${url}`);
  }

  const { response, url: finalUrl } = await requestImage(
    parsedUrl,
    maximumRedirects,
  );
  try {
    const extension = resolveImageExtension(
      finalUrl.href,
      readHeader(response, "content-type") ?? null,
    );
    const bytes = await readLimitedBody(response);
    validateImageBytes(bytes, extension);
    return { bytes, extension };
  } catch (error) {
    response.destroy();
    throw error;
  }
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

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function imageOrigin(url: string): string {
  try {
    return new URL(url).origin;
  } catch {
    return "无效图片地址";
  }
}

async function rewriteMarkdownImages(
  markdown: string,
  slug: string,
  directory: string,
  fetchImage: ImageFetcher,
  reporter: SyncReporter,
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
  const processedUrls = new Map<string, string | null>();

  if (remoteImages.length > 0) {
    reporter.info(`  🖼️  发现 ${remoteImages.length} 张图片需要下载`);
  }

  for (const image of remoteImages) {
    let filename = processedUrls.get(image.url);
    if (filename === undefined) {
      const baseName = `image-${processedUrls.size + 1}`;
      reporter.info(`  ⬇️  下载: ${slug}/${baseName}`);
      try {
        filename = await saveImage(
          directory,
          baseName,
          await fetchImage(image.url),
        );
        processedUrls.set(image.url, filename);
        reporter.info(`  ✅ 已保存: ${slug}/${filename}`);
      } catch (error) {
        processedUrls.set(image.url, null);
        reporter.warn(`  ⚠️  下载失败: ${imageOrigin(image.url)}`);
        reporter.warn(`     ${errorMessage(error)}`);
        filename = null;
      }
    }
    if (filename === null) continue;
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
  reporter: SyncReporter = silentSyncReporter,
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
      reporter,
    );
    let coverPath: string | undefined;
    if (article.coverUrl) {
      reporter.info(`  🖼️  下载封面图: ${article.slug}/cover`);
      try {
        const filename = await saveImage(
          temporary,
          "cover",
          await fetchImage(article.coverUrl),
        );
        coverPath = `/images/notion/${article.slug}/${filename}`;
        reporter.info(`  ✅ 封面图已保存: ${article.slug}/${filename}`);
      } catch (error) {
        reporter.warn(`  ⚠️  封面图下载失败: ${imageOrigin(article.coverUrl)}`);
        reporter.warn(`     ${errorMessage(error)}`);
      }
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
  T extends {
    readonly avatarUrl?: string;
    readonly name: string;
    readonly url: string;
  },
>(
  friends: readonly T[],
  publicRoot: string,
  fetchImage: ImageFetcher = fetchRemoteImage,
  reporter: SyncReporter = silentSyncReporter,
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
      try {
        const filename = await saveImage(
          temporary,
          createFriendAvatarBaseName(friend.url),
          await fetchImage(avatarUrl),
        );
        localized.push({ ...details, avatar: `/images/friends/${filename}` });
      } catch (error) {
        reporter.warn(`  ⚠️  头像下载失败: ${friend.name}`);
        reporter.warn(`     ${errorMessage(error)}`);
        localized.push(details);
      }
    }
    await replaceDirectory(temporary, destination);
    return localized;
  } catch (error) {
    await rm(temporary, { force: true, recursive: true });
    throw error;
  }
}
