export class ContentValidationError extends Error {
  readonly sourcePath: string;

  constructor(sourcePath: string, message: string) {
    super(`${sourcePath}: ${message}`);
    this.name = "ContentValidationError";
    this.sourcePath = sourcePath;
  }
}
