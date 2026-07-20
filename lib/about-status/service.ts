import { siteConfig } from "../../site.config";

import { parseGitHubContributions } from "./github";
import { parseTokenBoardStatus } from "./tokenboard";
import type { AboutActivityStatus } from "./types";

const defaultTimeoutMs = 8_000;

export interface AboutStatusServiceOptions {
  readonly fetcher?: typeof fetch;
  readonly githubUsername?: string;
  readonly now?: () => Date;
  readonly timeoutMs?: number;
  readonly tokenBoardUrl?: string;
}

async function fetchWithTimeout(
  fetcher: typeof fetch,
  url: string,
  timeoutMs: number,
  headers: Readonly<Record<string, string>> = {},
): Promise<Response> {
  const controller = new AbortController();
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      controller.abort();
      reject(new Error(`Request to ${new URL(url).origin} timed out.`));
    }, timeoutMs);
  });

  try {
    return await Promise.race([
      fetcher(url, { headers, signal: controller.signal }),
      timeout,
    ]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

async function loadGitHub(
  fetcher: typeof fetch,
  username: string,
  timeoutMs: number,
) {
  const response = await fetchWithTimeout(
    fetcher,
    `https://github.com/users/${encodeURIComponent(username)}/contributions`,
    timeoutMs,
    {
      Accept: "text/html",
      "Accept-Language": "en-US,en;q=0.9",
    },
  );
  if (!response.ok) {
    throw new Error(
      `GitHub contribution request failed with ${response.status}.`,
    );
  }
  return parseGitHubContributions(await response.text(), username);
}

async function loadTokenBoard(
  fetcher: typeof fetch,
  url: string,
  timeoutMs: number,
) {
  const response = await fetchWithTimeout(fetcher, url, timeoutMs, {
    Accept: "application/json",
  });
  if (!response.ok) {
    throw new Error(`TokenBoard request failed with ${response.status}.`);
  }
  return parseTokenBoardStatus(await response.json());
}

export async function loadAboutActivityStatus(
  options: AboutStatusServiceOptions = {},
): Promise<AboutActivityStatus> {
  const fetcher = options.fetcher ?? fetch;
  const githubUsername =
    options.githubUsername ?? siteConfig.profileStatus.github.username;
  const tokenBoardUrl =
    options.tokenBoardUrl ?? siteConfig.profileStatus.tokenBoard.publicJsonUrl;
  const timeoutMs = options.timeoutMs ?? defaultTimeoutMs;

  const [github, tokenBoard] = await Promise.all([
    siteConfig.profileStatus.github.enabled
      ? loadGitHub(fetcher, githubUsername, timeoutMs).catch(() => null)
      : Promise.resolve(null),
    siteConfig.profileStatus.tokenBoard.enabled
      ? loadTokenBoard(fetcher, tokenBoardUrl, timeoutMs).catch(() => null)
      : Promise.resolve(null),
  ]);

  return {
    generatedAt: (options.now ?? (() => new Date()))().toISOString(),
    github,
    tokenBoard,
  };
}
