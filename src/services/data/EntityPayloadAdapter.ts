import type { CanonicalEntity } from './CanonicalCareerRepository';

/** Converts partial AI payloads into repository-ready records without changing supplied values. */
export class EntityPayloadAdapter {
  normalize(entity: CanonicalEntity, payload: Record<string, unknown>): Record<string, unknown> {
    const now = new Date().toISOString(); const id = typeof payload.id === 'string' ? payload.id : `${entity}-${Date.now()}`;
    const base = { ...payload, id, updatedAt: payload.updatedAt ?? now };
    if (entity === 'opportunity') return { ...base, title: payload.title ?? 'Untitled opportunity', organization: payload.organization ?? '', category: payload.category ?? 'Internship', source: payload.source ?? 'Nova', applicationLink: payload.officialLink ?? payload.applicationLink ?? '', applyDate: payload.applicationDate ?? new Date().toISOString().slice(0, 10), deadline: payload.deadline ?? '', status: payload.status ?? 'Saved', priority: payload.priority ?? 'Medium', notes: payload.notes ?? '', skills: array(payload.skills), checklist: array(payload.checklist), tags: array(payload.tags) };
    if (entity === 'project') return { ...base, title: payload.title ?? 'Untitled project', description: payload.description ?? '', status: payload.status ?? 'idea', skills: array(payload.technologies ?? payload.skills), links: array(payload.links) };
    if (entity === 'goal') return { ...base, title: payload.title ?? 'Untitled goal', status: payload.status ?? 'active', priority: payload.priority ?? 'medium' };
    if (entity === 'mission') return { ...base, title: payload.title ?? 'Today’s mission', status: payload.status ?? 'open', date: payload.date ?? new Date().toISOString().slice(0, 10) };
    if (entity === 'learning') return { ...base, title: payload.title ?? 'Untitled learning item', status: payload.status ?? 'planned', progress: payload.progress ?? 0, skills: array(payload.skills) };
    if (entity === 'skill') return { ...base, name: payload.name ?? payload.title ?? 'Untitled skill', level: payload.level ?? 'beginner', tags: array(payload.tags) };
    if (entity === 'certification') return { ...base, name: payload.name ?? payload.title ?? 'Untitled certification', platform: payload.platform ?? '', date: payload.date ?? new Date().toISOString().slice(0, 10), category: payload.category ?? 'Certification', notes: payload.notes ?? '' };
    if (entity === 'note') return { ...base, title: payload.title ?? 'Untitled note', content: payload.content ?? payload.notes ?? '', tags: array(payload.tags), isPinned: payload.isPinned ?? false };
    return { ...base, date: payload.date ?? new Date().toISOString().slice(0, 10), learned: payload.learned ?? '', built: payload.built ?? '', applications: array(payload.applications), certificates: array(payload.certificates), codingPractice: payload.codingPractice ?? '', achievements: payload.achievements ?? '' };
  }
}
function array(value: unknown): unknown[] { return Array.isArray(value) ? value : []; }
