import { describe, expect, it, vi } from "vitest";

import { parseGitHubContributions } from "@/lib/about-status/github";
import { loadAboutActivityStatus } from "@/lib/about-status/service";
import { parseTokenBoardStatus } from "@/lib/about-status/tokenboard";

const githubHtml = `
  <table>
    <tbody>
      <tr>
        <td class="ContributionCalendar-day" data-date="2026-07-18" data-level="0" id="day-1"></td>
        <td class="ContributionCalendar-day" data-date="2026-07-19" data-level="2" id="day-2"></td>
        <td class="ContributionCalendar-day" data-date="2026-07-20" data-level="4" id="day-3"></td>
      </tr>
    </tbody>
  </table>
  <tool-tip for="day-1">No contributions on July 18th.</tool-tip>
  <tool-tip for="day-2">3 contributions on July 19th.</tool-tip>
  <tool-tip for="day-3">1,024 contributions on July 20th.</tool-tip>
`;

const tokenBoardJson = {
  month: { cost: 13.4, tokens: 128_600_000 },
  sourceSplit: [
    { cost: 7, source: "claude", totalTokens: 80_000_000 },
    { cost: 4, source: "codex", totalTokens: 48_600_000 },
  ],
  today: { cost: 1.2, tokens: 2_400_000 },
  topModels: [{ cost: 6, model: "claude-sonnet", totalTokens: 60_000_000 }],
  total: { cachedTokens: 42, cost: 99, tokens: 900_000_000 },
};

describe("about status", () => {
  it("parses GitHub days, levels and contribution totals", () => {
    expect(parseGitHubContributions(githubHtml, "evepupil")).toEqual({
      activeDays: 2,
      days: [
        { count: 0, date: "2026-07-18", level: 0 },
        { count: 3, date: "2026-07-19", level: 2 },
        { count: 1024, date: "2026-07-20", level: 4 },
      ],
      totalContributions: 1027,
      username: "evepupil",
    });
  });

  it("rejects empty and incomplete GitHub calendars", () => {
    expect(() => parseGitHubContributions("<html></html>", "evepupil")).toThrow(
      /did not contain any days/u,
    );
    expect(() =>
      parseGitHubContributions(
        '<table><tr><td class="ContributionCalendar-day" data-date="2026-07-20" data-level="2" id="missing"></td></tr></table>',
        "evepupil",
      ),
    ).toThrow(/count is missing/u);
  });

  it("keeps public Token counts and strips costs and cache details", () => {
    const result = parseTokenBoardStatus(tokenBoardJson);
    expect(result).toEqual({
      monthTokens: 128_600_000,
      sourceSplit: [
        { source: "claude", totalTokens: 80_000_000 },
        { source: "codex", totalTokens: 48_600_000 },
      ],
      todayTokens: 2_400_000,
      topModels: [{ model: "claude-sonnet", totalTokens: 60_000_000 }],
      totalTokens: 900_000_000,
    });
    expect(JSON.stringify(result)).not.toMatch(/cost|cached/u);
  });

  it("returns the successful provider when the other provider fails", async () => {
    const fetcher = vi.fn<typeof fetch>(async (input) => {
      const url = String(input);
      if (url.includes("github.com")) {
        return new Response("blocked", { status: 403 });
      }
      return Response.json(tokenBoardJson);
    });

    const result = await loadAboutActivityStatus({
      fetcher,
      githubUsername: "evepupil",
      now: () => new Date("2026-07-20T08:00:00.000Z"),
      tokenBoardUrl: "https://tokenboard.example/public.json",
    });

    expect(result.github).toBeNull();
    expect(result.tokenBoard?.monthTokens).toBe(128_600_000);
    expect(result.generatedAt).toBe("2026-07-20T08:00:00.000Z");
    expect(fetcher).toHaveBeenCalledTimes(2);
  });
});
