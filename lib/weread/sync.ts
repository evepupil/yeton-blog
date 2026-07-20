import { randomUUID } from "node:crypto";
import {
  access,
  mkdir,
  mkdtemp,
  rename,
  rm,
  writeFile,
} from "node:fs/promises";
import path from "node:path";

import { parseReadingStatus } from "@/lib/about-status/reading";
import type {
  ReadingBookStatus,
  ReadingStatus,
} from "@/lib/about-status/types";

import { fetchAnnualReadingStats, fetchShelf } from "./client";
import { downloadReadingCover } from "./images";
import { createReadingStatus, selectRecentPublicBooks } from "./transform";

export interface WereadSyncLogger {
  info(message: string): void;
  warn(message: string): void;
}

export type WereadSyncResult =
  | { readonly status: "skipped" }
  | { readonly bookCount: number; readonly status: "updated" };

interface WereadSyncOptions {
  readonly apiKey?: string;
  readonly dataPath?: string;
  readonly fetcher?: typeof fetch;
  readonly imageDirectory?: string;
  readonly logger?: WereadSyncLogger;
  readonly now?: () => Date;
  readonly workspaceRoot?: string;
}

const consoleLogger: WereadSyncLogger = {
  info: (message) => console.log(message),
  warn: (message) => console.warn(message),
};

async function exists(targetPath: string): Promise<boolean> {
  try {
    await access(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function replaceSnapshot(
  status: ReadingStatus,
  stagingImageDirectory: string,
  dataPath: string,
  imageDirectory: string,
): Promise<void> {
  parseReadingStatus(status);

  const transactionId = randomUUID();
  const dataBackup = `${dataPath}.backup-${transactionId}`;
  const dataStaging = `${dataPath}.staging-${transactionId}`;
  const imageBackup = `${imageDirectory}.backup-${transactionId}`;
  let dataBackedUp = false;
  let dataInstalled = false;
  let imagesBackedUp = false;
  let imagesInstalled = false;
  let committed = false;

  await mkdir(path.dirname(dataPath), { recursive: true });
  await writeFile(dataStaging, `${JSON.stringify(status, null, 2)}\n`, "utf8");

  try {
    if (await exists(dataPath)) {
      await rename(dataPath, dataBackup);
      dataBackedUp = true;
    }
    if (await exists(imageDirectory)) {
      await rename(imageDirectory, imageBackup);
      imagesBackedUp = true;
    }

    await rename(stagingImageDirectory, imageDirectory);
    imagesInstalled = true;
    await rename(dataStaging, dataPath);
    dataInstalled = true;
    committed = true;
  } catch (error) {
    if (dataInstalled) await rm(dataPath, { force: true });
    if (imagesInstalled) {
      await rm(imageDirectory, { force: true, recursive: true });
    }
    if (dataBackedUp) await rename(dataBackup, dataPath);
    if (imagesBackedUp) await rename(imageBackup, imageDirectory);
    throw error;
  } finally {
    await rm(dataStaging, { force: true });
    if (committed) {
      await Promise.all([
        rm(dataBackup, { force: true }),
        rm(imageBackup, { force: true, recursive: true }),
      ]);
    }
  }
}

export async function syncWereadStatus(
  options: WereadSyncOptions,
): Promise<WereadSyncResult> {
  const apiKey = options.apiKey?.trim();
  const logger = options.logger ?? consoleLogger;
  if (!apiKey) {
    logger.info(
      "[微信读书] 未配置 WEREAD_API_KEY，跳过同步；页面继续显示等待接入状态。",
    );
    return { status: "skipped" };
  }
  if (!apiKey.startsWith("wrk-")) {
    throw new Error("WEREAD_API_KEY 格式无效，应以 wrk- 开头");
  }

  const workspaceRoot = options.workspaceRoot ?? process.cwd();
  const dataPath =
    options.dataPath ?? path.join(workspaceRoot, "data", "reading-status.json");
  const imageDirectory =
    options.imageDirectory ??
    path.join(workspaceRoot, "public", "images", "reading");
  const fetcher = options.fetcher ?? fetch;

  logger.info("[微信读书] 正在读取年度统计和书架...");
  const [annualStats, shelf] = await Promise.all([
    fetchAnnualReadingStats({ apiKey, fetcher }),
    fetchShelf({ apiKey, fetcher }),
  ]);
  const selectedBooks = selectRecentPublicBooks(shelf.books);
  logger.info(`[微信读书] 找到 ${selectedBooks.length} 本最近阅读的公开书籍。`);

  await mkdir(path.dirname(imageDirectory), { recursive: true });
  const stagingImageDirectory = await mkdtemp(
    path.join(path.dirname(imageDirectory), ".reading-staging-"),
  );

  try {
    const books = await Promise.all(
      selectedBooks.map(async (book): Promise<ReadingBookStatus> => {
        let cover = "";
        if (book.coverUrl) {
          try {
            cover = await downloadReadingCover({
              author: book.author,
              fetcher,
              sourceUrl: book.coverUrl,
              targetDirectory: stagingImageDirectory,
              title: book.title,
            });
          } catch {
            logger.warn(
              `[微信读书] 《${book.title}》封面下载失败，将使用页面占位图。`,
            );
          }
        }

        return {
          author: book.author,
          cover,
          state: book.state,
          title: book.title,
        };
      }),
    );
    const status = createReadingStatus(
      annualStats,
      books,
      (options.now ?? (() => new Date()))(),
    );
    await replaceSnapshot(
      status,
      stagingImageDirectory,
      dataPath,
      imageDirectory,
    );
    logger.info("[微信读书] 阅读状态已更新。");
    return { bookCount: books.length, status: "updated" };
  } finally {
    await rm(stagingImageDirectory, { force: true, recursive: true });
  }
}
