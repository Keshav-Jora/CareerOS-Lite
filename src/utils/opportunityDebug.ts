type OpportunityDebugStage =
  | 'Raw user message'
  | 'IntentService'
  | 'EntityRecognitionService'
  | 'ExtractionService'
  | 'ValidationService'
  | 'ActionPlanBuilder'
  | 'ActionRouter'
  | 'EntityPayloadAdapter'
  | 'CanonicalCareerRepository'
  | 'Storage'
  | 'useAppData'
  | 'OpportunitiesView';

let previousPayload: Record<string, unknown> | undefined;

/** Temporary development-only instrumentation for the opportunity creation audit. */
export function logOpportunityDebug(
  stage: OpportunityDebugStage,
  sourceFile: string,
  functionName: string,
  input: unknown,
  output: unknown,
): void {
  if (!import.meta.env.DEV) return;

  const currentPayload = asRecord(output);
  const differences = previousPayload && currentPayload
    ? Object.keys(currentPayload).filter((key) => JSON.stringify(previousPayload?.[key]) !== JSON.stringify(currentPayload[key]))
    : [];

  console.groupCollapsed(`[Opportunity Debug] ${stage}`);
  console.log('Stage:', stage);
  console.log('Source File:', sourceFile);
  console.log('Function:', functionName);
  console.log('Input:', input);
  console.log('Output:', output);
  console.log('Input JSON:', JSON.stringify(input));
  console.log('Output JSON:', JSON.stringify(output));
  if (differences.length) console.warn('Changed from previous structured stage:', differences);
  console.groupEnd();

  if (currentPayload) previousPayload = currentPayload;
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : undefined;
}
