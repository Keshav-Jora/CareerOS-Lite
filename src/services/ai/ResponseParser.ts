export type NovaResponseParseResult =
  | { success: true; text: string }
  | { success: false; message: string };

/** Plain-text parser with an extension point for future structured Nova outputs. */
export class ResponseParser {
  parseText(value: string | undefined): NovaResponseParseResult {
    const text = value?.trim();
    return text
      ? { success: true, text }
      : { success: false, message: 'Nova returned an empty response.' };
  }
}
