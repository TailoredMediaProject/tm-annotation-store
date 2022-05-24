export class AnnotationError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly message: string,
    public readonly data?: unknown) {
    super(message);
  }
}
