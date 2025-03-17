export class SegmentAnalyzer {
  constructor(private segment: string) {}

  isParameter(): boolean {
    return SegmentAnalyzer.isParameter(this.segment);
  }

  isWildcard(): boolean {
    return SegmentAnalyzer.isWildcard(this.segment);
  }

  extractParameterName(): string {
    return SegmentAnalyzer.extractParameterName(this.segment);
  }

  static isParameter(segment: string): boolean {
    return segment.startsWith(':');
  }

  static isWildcard(segment: string): boolean {
    return segment === '*';
  }
  static extractParameterName(segment: string): string {
    if (this.isParameter(segment)) {
      return segment.substring(1);
    }

    return '';
  }
}
