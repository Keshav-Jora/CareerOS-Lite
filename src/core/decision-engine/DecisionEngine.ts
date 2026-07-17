import type { CareerModel, EngineOutput } from '../../types/core.types';
import type { AIProvider } from './AIProvider';
import { PromptBuilder } from './PromptBuilder';
import { ResponseParser, type ResponseParserError } from './ResponseParser';

export interface DecisionEngineError {
  stage: 'prompt-generation' | 'provider' | 'response-parsing';
  code: 'prompt-generation-failed' | 'provider-failed' | 'response-parsing-failed';
  message: string;
  parserErrors?: ResponseParserError[];
}

export type DecisionEngineResult =
  | { success: true; output: EngineOutput }
  | { success: false; error: DecisionEngineError };

/**
 * Coordinates prompt creation, provider execution, and response validation.
 */
export class DecisionEngine {
  constructor(
    private readonly provider: AIProvider,
    private readonly promptBuilder: PromptBuilder = new PromptBuilder(),
    private readonly responseParser: ResponseParser = new ResponseParser(),
  ) {}

  async run(careerModel: CareerModel): Promise<DecisionEngineResult> {
    let prompt: string;

    try {
      prompt = this.promptBuilder.build(careerModel);
    } catch (error) {
      return {
        success: false,
        error: {
          stage: 'prompt-generation',
          code: 'prompt-generation-failed',
          message: this.errorMessage(error, 'Unable to generate a career context prompt.'),
        },
      };
    }

    let rawResponse: string;

    try {
      rawResponse = await this.provider.generate(prompt);
    } catch (error) {
      return {
        success: false,
        error: {
          stage: 'provider',
          code: 'provider-failed',
          message: this.errorMessage(error, 'The AI provider did not return a response.'),
        },
      };
    }

    try {
      const parsedResponse = this.responseParser.parse(rawResponse);

      if ('output' in parsedResponse) {
        return { success: true, output: parsedResponse.output };
      }

      return {
        success: false,
        error: {
          stage: 'response-parsing',
          code: 'response-parsing-failed',
          message: 'The AI provider returned an invalid decision-engine response.',
          parserErrors: parsedResponse.errors,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: {
          stage: 'response-parsing',
          code: 'response-parsing-failed',
          message: this.errorMessage(error, 'Unable to parse the AI provider response.'),
        },
      };
    }
  }

  private errorMessage(error: unknown, fallback: string): string {
    return error instanceof Error && error.message.trim().length > 0 ? error.message : fallback;
  }
}
