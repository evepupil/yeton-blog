export interface GitHubContributionDay {
  readonly count: number;
  readonly date: string;
  readonly level: 0 | 1 | 2 | 3 | 4;
}

export interface GitHubContributionStatus {
  readonly activeDays: number;
  readonly days: readonly GitHubContributionDay[];
  readonly totalContributions: number;
  readonly username: string;
}

export interface TokenBoardSourceStatus {
  readonly source: string;
  readonly totalTokens: number;
}

export interface TokenBoardModelStatus {
  readonly model: string;
  readonly totalTokens: number;
}

export interface TokenBoardStatus {
  readonly monthTokens: number;
  readonly sourceSplit: readonly TokenBoardSourceStatus[];
  readonly todayTokens: number;
  readonly topModels: readonly TokenBoardModelStatus[];
  readonly totalTokens: number;
}

export interface AboutActivityStatus {
  readonly generatedAt: string;
  readonly github: GitHubContributionStatus | null;
  readonly tokenBoard: TokenBoardStatus | null;
}

export interface ReadingBookStatus {
  readonly author: string;
  readonly cover: string;
  readonly state: "finished" | "reading" | "saved";
  readonly title: string;
}

export interface ReadingStatus {
  readonly activeDays: number | null;
  readonly books: readonly ReadingBookStatus[];
  readonly finishedBooks: number | null;
  readonly totalMinutes: number | null;
  readonly updatedAt: string | null;
}
