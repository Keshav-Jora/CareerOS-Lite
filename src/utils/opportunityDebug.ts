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

/** Retained as a compatibility hook after the temporary opportunity audit. */
export function logOpportunityDebug(
  _stage: OpportunityDebugStage,
  _sourceFile: string,
  _functionName: string,
  _input: unknown,
  _output: unknown,
): void {
  // Intentionally no-op: temporary audit logging has been removed.
}
