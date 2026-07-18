export type NovaActionType = 'add_skill' | 'update_skill' | 'delete_skill' | 'add_learning' | 'complete_learning' | 'update_learning' | 'create_goal' | 'update_goal' | 'complete_goal' | 'add_opportunity' | 'delete_opportunity' | 'archive_opportunity' | 'change_opportunity_status' | 'complete_mission' | 'skip_mission' | 'set_mission_focus' | 'update_dsa_progress' | 'unknown';

export interface NovaActionIntent {
  type: NovaActionType;
  entity: string;
  parameters: Record<string, string | number>;
  confidence: number;
  requiresConfirmation: boolean;
}

export interface NovaActionResult {
  status: 'executed' | 'confirmation-required' | 'not-handled' | 'failed';
  message: string;
  intent?: NovaActionIntent;
}
