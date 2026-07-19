import type { CanonicalEntity } from './CanonicalCareerRepository';

/** Converts partial AI payloads into repository-ready records without changing supplied values. */
export class EntityPayloadAdapter {
  normalize(entity: CanonicalEntity, payload: Record<string, unknown>): Record<string, unknown> {
    const now = new Date().toISOString(); const id = typeof payload.id === 'string' ? payload.id : `${entity}-${Date.now()}`;
    const base = { ...payload, id, updatedAt: payload.updatedAt ?? now };
    if (entity === 'opportunity') return { ...base, title: payload.title ?? 'Untitled opportunity', organization: payload.organization ?? '', category: payload.category ?? 'Internship', source: payload.source ?? 'Nova', applicationLink: payload.officialLink ?? payload.applicationLink ?? '', applyDate: payload.applicationDate ?? new Date().toISOString().slice(0, 10), deadline: payload.deadline ?? '', status: payload.status ?? 'Saved', priority: payload.priority ?? 'Medium', notes: payload.notes ?? '', skills: array(payload.skills), checklist: checklist(payload.checklist), tags: array(payload.tags) };
    if (entity === 'project') return { ...base, title: payload.title ?? 'Untitled project', description: payload.description ?? '', status: payload.status ?? 'idea', skills: array(payload.technologies ?? payload.skills), links: array(payload.links) };
    if (entity === 'goal') return { ...base, title: payload.title ?? 'Untitled goal', status: payload.status ?? 'active', priority: payload.priority ?? 'medium' };
    if (entity === 'mission') return { ...base, title: payload.title ?? "Today's Mission", status: payload.status ?? 'open', date: payload.date ?? new Date().toISOString().slice(0, 10), tasks: missionTasks(payload.tasks ?? payload.checklist), duration: payload.duration ?? '45 min', priority: payload.priority ?? 'High' };
    if (entity === 'learning') return { ...base, title: payload.title ?? 'Untitled learning item', status: payload.status ?? 'planned', progress: payload.progress ?? 0, skills: array(payload.skills) };
    if (entity === 'skill') return { ...base, name: payload.name ?? payload.title ?? 'Untitled skill', level: payload.level ?? 'beginner', tags: array(payload.tags) };
    if (entity === 'certification') return { ...base, name: payload.name ?? payload.title ?? 'Untitled certification', platform: payload.platform ?? '', date: payload.date ?? new Date().toISOString().slice(0, 10), category: payload.category ?? 'Certification', notes: payload.notes ?? '' };
    if (entity === 'note') return { ...base, title: payload.title ?? 'Untitled note', content: payload.content ?? payload.notes ?? '', tags: array(payload.tags), isPinned: payload.isPinned ?? false };
    return { ...base, date: payload.date ?? new Date().toISOString().slice(0, 10), learned: payload.learned ?? '', built: payload.built ?? '', applications: array(payload.applications), certificates: array(payload.certificates), codingPractice: payload.codingPractice ?? '', achievements: payload.achievements ?? '' };
  }
}
function array(value: unknown): unknown[] { return Array.isArray(value) ? value : []; }

function checklist(value: unknown): { id: string; label: string; done: boolean }[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item, index) => {
    if (typeof item === 'string' && item.trim()) {
      return [{ id: `checklist-${index + 1}`, label: item.trim(), done: false }];
    }
    if (isChecklistItem(item)) return [item];
    return [];
  });
}

function isChecklistItem(value: unknown): value is { id: string; label: string; done: boolean } {
  if (!value || typeof value !== 'object') return false;
  const item = value as Record<string, unknown>;
  return typeof item.id === 'string' && typeof item.label === 'string' && typeof item.done === 'boolean';
}

function missionTasks(value: unknown): { id: string; label: string; completed: boolean }[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item, index) => {
    if (typeof item === 'string' && item.trim()) return [{ id: `mission-task-${index + 1}`, label: item.trim(), completed: false }];
    if (!item || typeof item !== 'object') return [];
    const task = item as Record<string, unknown>;
    if (typeof task.id !== 'string' || typeof task.label !== 'string') return [];
    return [{ id: task.id, label: task.label, completed: task.completed === true }];
  });
}
