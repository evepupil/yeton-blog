export interface ReadingMetrics {
  readonly chineseCharacters: number;
  readonly latinWords: number;
  readonly readTime: number;
  readonly wordCount: number;
}

const chineseCharacterPattern = /\p{Script=Han}/gu;
const latinWordPattern = /[\p{L}\p{N}]+(?:['’-][\p{L}\p{N}]+)*/gu;

export function calculateReadingMetrics(text: string): ReadingMetrics {
  const chineseCharacters = text.match(chineseCharacterPattern)?.length ?? 0;
  const withoutChinese = text.replace(chineseCharacterPattern, " ");
  const latinWords = withoutChinese.match(latinWordPattern)?.length ?? 0;
  const readTime = Math.max(
    1,
    Math.ceil(chineseCharacters / 300 + latinWords / 200),
  );

  return {
    chineseCharacters,
    latinWords,
    readTime,
    wordCount: chineseCharacters + latinWords,
  };
}
