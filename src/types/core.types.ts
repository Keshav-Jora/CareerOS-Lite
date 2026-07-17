/**
 * Shared contracts for the CareerOS core architecture.
 * All date-time values use ISO 8601 strings unless otherwise noted.
 */

export interface CareerModel {
  id: string;
  userId: string;
  displayName?: string;
  headline?: string;
  goals: Goal[];
  skills: Skill[];
  projects: Project[];
  applications: Application[];
  deadlines: Deadline[];
  updatedAt: string;
  externalReferences?: Record<string, string>;
}

export interface Goal {
  id: string;
  title: string;
  description?: string;
  status: 'not-started' | 'in-progress' | 'completed' | 'paused';
  priority: 'low' | 'medium' | 'high';
  targetDate?: string;
  relatedSkillIds?: string[];
  relatedProjectIds?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Skill {
  id: string;
  name: string;
  category?: string;
  proficiency?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  evidenceUrls?: string[];
  relatedProjectIds?: string[];
  lastPracticedAt?: string;
  externalReferences?: Record<string, string>;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  status: 'idea' | 'active' | 'completed' | 'archived';
  repositoryUrl?: string;
  deployedUrl?: string;
  skillIds: string[];
  startedAt?: string;
  completedAt?: string;
  externalReferences?: Record<string, string>;
}

export interface Application {
  id: string;
  title: string;
  organization: string;
  status: 'saved' | 'draft' | 'submitted' | 'under-review' | 'interviewing' | 'offered' | 'rejected' | 'withdrawn';
  applicationUrl?: string;
  submittedAt?: string;
  deadlineId?: string;
  source: string;
  externalReferences?: Record<string, string>;
  updatedAt: string;
}

export interface Deadline {
  id: string;
  title: string;
  dueAt: string;
  timezone?: string;
  status: 'upcoming' | 'completed' | 'missed' | 'cancelled';
  relatedEntityType?: 'goal' | 'project' | 'application';
  relatedEntityId?: string;
  calendarEventId?: string;
  reminderOffsetsMinutes?: number[];
  externalReferences?: Record<string, string>;
}

export interface Recommendation {
  id: string;
  title: string;
  description: string;
  confidence: number;
  reasoning: string;
  category: 'goal' | 'skill' | 'project' | 'application' | 'deadline' | 'general';
  priority: 'low' | 'medium' | 'high';
  status: 'active' | 'accepted' | 'dismissed' | 'completed';
  relatedEntityIds?: string[];
  explainabilityTraceId?: string;
  createdAt: string;
  expiresAt?: string;
}

export interface DecisionMemoryEntry {
  id: string;
  recommendationId?: string;
  decision: 'accepted' | 'dismissed' | 'completed' | 'deferred';
  rationale?: string;
  contextSnapshot: Record<string, unknown>;
  recordedAt: string;
}

export interface ExplainabilityTrace {
  id: string;
  recommendationId: string;
  summary: string;
  contributingFactors: Array<{
    name: string;
    impact: 'positive' | 'negative' | 'neutral';
    detail: string;
  }>;
  dataSources: Array<{
    source: string;
    referenceId?: string;
    retrievedAt?: string;
  }>;
  generatedAt: string;
}

export interface EngineInput {
  careerModel: CareerModel;
  decisionMemory: DecisionMemoryEntry[];
  requestedCategories?: Recommendation['category'][];
  generatedAt: string;
}

export interface EngineOutput {
  recommendations: Recommendation[];
  explainabilityTraces: ExplainabilityTrace[];
  generatedAt: string;
}
