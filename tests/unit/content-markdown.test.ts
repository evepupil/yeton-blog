import { describe, expect, it } from "vitest";

import { analyzeMarkdown } from "@/lib/content/markdown";

describe("analyzeMarkdown", () => {
  it("extracts level-two and level-three headings with stable unique ids", () => {
    const result = analyzeMarkdown(`
# Page title

## Repeated heading

Paragraph text.

## Repeated heading

### 细节
`);

    expect(result.headings).toEqual([
      { depth: 2, id: "repeated-heading", text: "Repeated heading" },
      { depth: 2, id: "repeated-heading-1", text: "Repeated heading" },
      { depth: 3, id: "细节", text: "细节" },
    ]);
    expect(result.plainText).toContain("Paragraph text.");
  });
});
