import type { Certificate, Note, Opportunity, Task, TimelineEntry } from '../types';
import type { ExternalConnection } from '../services/integrations/contracts/Connection';

export interface CareerSkill { id: string; name: string; level: 'beginner' | 'intermediate' | 'advanced'; tags: string[]; updatedAt: string; }
export interface CareerLearning { id: string; title: string; provider?: string; status: 'planned' | 'in-progress' | 'completed'; progress: number; skills: string[]; completedAt?: string; updatedAt: string; }
export interface CareerGoal { id: string; title: string; status: 'active' | 'completed' | 'skipped'; priority: 'low' | 'medium' | 'high'; dueDate?: string; updatedAt: string; }
export interface MissionTask { id: string; label: string; completed: boolean; }
export interface CareerMission { id: string; title: string; status: 'open' | 'completed' | 'skipped'; date: string; updatedAt: string; tasks?: MissionTask[]; duration?: string; priority?: 'High' | 'Medium' | 'Low'; }
export interface CareerProject { id: string; title: string; description: string; status: 'idea' | 'active' | 'completed' | 'archived'; skills: string[]; links: string[]; updatedAt: string; }
export interface NovaConversationMessage { id: string; role: 'user' | 'model'; content: string; timestamp: string; provider?: string; model?: string; }
export interface NovaConversation { id: string; title: string; createdAt: string; updatedAt: string; model: string; messages: NovaConversationMessage[]; pinned?: boolean; }

/** Canonical, AI-ready snapshot. Legacy UI collections remain mirrored for compatibility. */
export interface CanonicalCareerData {
  schemaVersion: 1;
  updatedAt: string;
  opportunities: Opportunity[];
  journey: TimelineEntry[];
  learning: CareerLearning[];
  skills: CareerSkill[];
  goals: CareerGoal[];
  missions: CareerMission[];
  projects: CareerProject[];
  certifications: Certificate[];
  notes: Note[];
  connections: ExternalConnection[];
  conversations: NovaConversation[];
}

export type LegacyGoal = Task;
