/** Provider-agnostic boundary for future AI integrations. */
export interface AIProvider {
  generate(prompt: string): Promise<string>;
}
