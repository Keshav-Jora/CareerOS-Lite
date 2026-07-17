import type { EngineOutput } from '../../types/core.types';

export interface ResponseParserError {
  code: 'invalid-json' | 'missing-field' | 'invalid-field-type' | 'unsupported-structure';
  message: string;
  field?: string;
}

export type ResponseParserResult =
  | { success: true; output: EngineOutput }
  | { success: false; errors: ResponseParserError[] };

/**
 * Safely converts provider-agnostic JSON output into the core engine contract.
 */
export class ResponseParser {
  parse(rawResponse: string): ResponseParserResult {
    const normalizedResponse = this.removeCodeFences(rawResponse);
    let parsedResponse: unknown;

    try {
      parsedResponse = JSON.parse(normalizedResponse);
    } catch {
      return {
        success: false,
        errors: [{
          code: 'invalid-json',
          message: 'The response is not valid JSON.',
        }],
      };
    }

    const errors: ResponseParserError[] = [];
    this.validateEngineOutput(parsedResponse, errors);

    return errors.length > 0
      ? { success: false, errors }
      : { success: true, output: parsedResponse as EngineOutput };
  }

  private removeCodeFences(rawResponse: string): string {
    const trimmedResponse = rawResponse.trim();
    const fencedResponse = trimmedResponse.match(/^```(?:json)?\s*\n([\s\S]*?)\n```$/i);
    return fencedResponse ? fencedResponse[1].trim() : trimmedResponse;
  }

  private validateEngineOutput(value: unknown, errors: ResponseParserError[]): void {
    if (!this.isRecord(value)) {
      this.addError(errors, 'unsupported-structure', 'The response root must be a JSON object.');
      return;
    }

    const recommendations = value.recommendations;
    if (!Array.isArray(recommendations)) {
      this.addErrorForField(errors, recommendations, 'recommendations', 'an array');
    } else if (recommendations.length === 0) {
      this.addError(errors, 'unsupported-structure', 'recommendations must contain at least one recommendation.', 'recommendations');
    } else {
      recommendations.forEach((recommendation, index) => {
        this.validateRecommendation(recommendation, `recommendations[${index}]`, errors);
      });
    }

    const traces = value.explainabilityTraces;
    if (!Array.isArray(traces)) {
      this.addErrorForField(errors, traces, 'explainabilityTraces', 'an array');
    } else {
      traces.forEach((trace, index) => {
        this.validateExplainabilityTrace(trace, `explainabilityTraces[${index}]`, errors);
      });
    }

    this.validateRequiredString(value, 'generatedAt', 'generatedAt', errors);
  }

  private validateRecommendation(value: unknown, path: string, errors: ResponseParserError[]): void {
    if (!this.isRecord(value)) {
      this.addError(errors, 'unsupported-structure', 'A recommendation must be an object.', path);
      return;
    }

    this.validateRequiredString(value, 'id', `${path}.id`, errors);
    this.validateRequiredString(value, 'title', `${path}.title`, errors);
    this.validateRequiredString(value, 'description', `${path}.description`, errors);
    this.validateRequiredString(value, 'reasoning', `${path}.reasoning`, errors);
    this.validateRequiredString(value, 'createdAt', `${path}.createdAt`, errors);
    this.validateRequiredNumber(value, 'confidence', `${path}.confidence`, errors, 0, 1);
    this.validateEnum(value, 'category', `${path}.category`, ['goal', 'skill', 'project', 'application', 'deadline', 'general'], errors);
    this.validateEnum(value, 'priority', `${path}.priority`, ['low', 'medium', 'high'], errors);
    this.validateEnum(value, 'status', `${path}.status`, ['active', 'accepted', 'dismissed', 'completed'], errors);
    this.validateOptionalStringArray(value, 'relatedEntityIds', `${path}.relatedEntityIds`, errors);
    this.validateOptionalString(value, 'explainabilityTraceId', `${path}.explainabilityTraceId`, errors);
    this.validateOptionalString(value, 'expiresAt', `${path}.expiresAt`, errors);
  }

  private validateExplainabilityTrace(value: unknown, path: string, errors: ResponseParserError[]): void {
    if (!this.isRecord(value)) {
      this.addError(errors, 'unsupported-structure', 'An explainability trace must be an object.', path);
      return;
    }

    this.validateRequiredString(value, 'id', `${path}.id`, errors);
    this.validateRequiredString(value, 'recommendationId', `${path}.recommendationId`, errors);
    this.validateRequiredString(value, 'summary', `${path}.summary`, errors);
    this.validateRequiredString(value, 'generatedAt', `${path}.generatedAt`, errors);
    this.validateContributingFactors(value.contributingFactors, `${path}.contributingFactors`, errors);
    this.validateDataSources(value.dataSources, `${path}.dataSources`, errors);
  }

  private validateContributingFactors(value: unknown, path: string, errors: ResponseParserError[]): void {
    if (!Array.isArray(value)) {
      this.addErrorForField(errors, value, path, 'an array');
      return;
    }

    value.forEach((factor, index) => {
      if (!this.isRecord(factor)) {
        this.addError(errors, 'unsupported-structure', 'A contributing factor must be an object.', `${path}[${index}]`);
        return;
      }

      this.validateRequiredString(factor, 'name', `${path}[${index}].name`, errors);
      this.validateRequiredString(factor, 'detail', `${path}[${index}].detail`, errors);
      this.validateEnum(factor, 'impact', `${path}[${index}].impact`, ['positive', 'negative', 'neutral'], errors);
    });
  }

  private validateDataSources(value: unknown, path: string, errors: ResponseParserError[]): void {
    if (!Array.isArray(value)) {
      this.addErrorForField(errors, value, path, 'an array');
      return;
    }

    value.forEach((source, index) => {
      if (!this.isRecord(source)) {
        this.addError(errors, 'unsupported-structure', 'A data source must be an object.', `${path}[${index}]`);
        return;
      }

      this.validateRequiredString(source, 'source', `${path}[${index}].source`, errors);
      this.validateOptionalString(source, 'referenceId', `${path}[${index}].referenceId`, errors);
      this.validateOptionalString(source, 'retrievedAt', `${path}[${index}].retrievedAt`, errors);
    });
  }

  private validateRequiredString(
    record: Record<string, unknown>,
    key: string,
    path: string,
    errors: ResponseParserError[],
  ): void {
    if (!(key in record)) {
      this.addError(errors, 'missing-field', `Missing required field: ${path}.`, path);
    } else if (typeof record[key] !== 'string' || record[key].trim().length === 0) {
      this.addError(errors, 'invalid-field-type', `${path} must be a non-empty string.`, path);
    }
  }

  private validateRequiredNumber(
    record: Record<string, unknown>,
    key: string,
    path: string,
    errors: ResponseParserError[],
    minimum: number,
    maximum: number,
  ): void {
    if (!(key in record)) {
      this.addError(errors, 'missing-field', `Missing required field: ${path}.`, path);
      return;
    }

    const value = record[key];
    if (typeof value !== 'number' || !Number.isFinite(value) || value < minimum || value > maximum) {
      this.addError(errors, 'invalid-field-type', `${path} must be a number between ${minimum} and ${maximum}.`, path);
    }
  }

  private validateEnum(
    record: Record<string, unknown>,
    key: string,
    path: string,
    values: readonly string[],
    errors: ResponseParserError[],
  ): void {
    if (!(key in record)) {
      this.addError(errors, 'missing-field', `Missing required field: ${path}.`, path);
    } else if (typeof record[key] !== 'string' || !values.includes(record[key])) {
      this.addError(errors, 'invalid-field-type', `${path} must be one of: ${values.join(', ')}.`, path);
    }
  }

  private validateOptionalString(record: Record<string, unknown>, key: string, path: string, errors: ResponseParserError[]): void {
    if (key in record && typeof record[key] !== 'string') {
      this.addError(errors, 'invalid-field-type', `${path} must be a string when provided.`, path);
    }
  }

  private validateOptionalStringArray(record: Record<string, unknown>, key: string, path: string, errors: ResponseParserError[]): void {
    if (!(key in record)) {
      return;
    }

    const value = record[key];
    if (!Array.isArray(value) || value.some((entry) => typeof entry !== 'string')) {
      this.addError(errors, 'invalid-field-type', `${path} must be an array of strings when provided.`, path);
    }
  }

  private addErrorForField(errors: ResponseParserError[], value: unknown, path: string, expected: string): void {
    const code = value === undefined ? 'missing-field' : 'invalid-field-type';
    this.addError(errors, code, `${path} must be ${expected}.`, path);
  }

  private addError(errors: ResponseParserError[], code: ResponseParserError['code'], message: string, field?: string): void {
    errors.push({ code, message, ...(field ? { field } : {}) });
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }
}
