import type { ActionIntent } from './IntentService';
import type { ActionEntity } from './EntityRecognitionService';

export type ExtractedPayload = Record<string, unknown>;
const knownSkills = ['DSA', 'SQL', 'React', 'Docker', 'AWS', 'TypeScript', 'JavaScript', 'Python', 'Java', 'Node.js', 'Git', 'Cloud'];

/** Pure, entity-scoped natural-language extraction. Validation and persistence are separate stages. */
export class ExtractionService {
  extract(message: string, _intent: ActionIntent | null, entity: ActionEntity | null): ExtractedPayload {
    if (!entity) return {};
    const base = { skills: this.skills(message), links: this.links(message), tags: this.tags(message), checklist: this.checklist(message) };
    if (entity === 'opportunity') return { ...base, title: this.title(message), organization: this.value(message, /\b(?:company|organization)\s*[:\-]?\s*([^\n.]+)/i), category: this.category(message), status: this.status(message), priority: this.value(message, /\bpriority\s*[:\-]?\s*(high|medium|low)/i), stage: this.value(message, /\b(?:stage|round)\s*[:\-]?\s*([^\n.]+)/i), applicationDate: this.dateAfter(message, /\b(?:applied|registered)(?:\s+on)?\s+/i), deadline: this.dateAfter(message, /\bdeadline\s*(?:is|on|:)?\s*/i), location: this.value(message, /\blocation\s*[:\-]?\s*([^\n.]+)/i), officialLink: this.links(message)[0] };
    if (entity === 'project') return { ...base, title: this.title(message), description: this.value(message, /\bdescription\s*[:\-]?\s*([^\n]+)/i), technologies: this.skills(message), status: this.status(message), repository: this.links(message).find((link) => /github\.com/i.test(link)), demo: this.links(message).find((link) => !/github\.com/i.test(link)) };
    if (entity === 'goal') return { title: this.title(message), targetDate: this.dateAfter(message, /\b(?:by|target date|deadline)\s*(?:is|on|:)?\s*/i), priority: this.value(message, /\bpriority\s*[:\-]?\s*(high|medium|low)/i), notes: this.value(message, /\bnotes?\s*[:\-]?\s*([^\n]+)/i) };
    if (entity === 'skill') return { name: this.value(message, /\b(?:add|learn|skill)\s+([A-Za-z0-9.+#-]+)/i) ?? this.skills(message)[0], level: this.value(message, /\b(beginner|intermediate|advanced)\b/i) };
    return { ...base, title: this.title(message) };
  }

  private title(message: string): string | undefined { return this.value(message, /\b(?:add|create|update|registered for|track)\s+([^\n.]+)/i); }
  private value(message: string, expression: RegExp): string | undefined { return message.match(expression)?.[1]?.trim(); }
  private skills(message: string): string[] { const lower = message.toLowerCase(); return knownSkills.filter((skill) => lower.includes(skill.toLowerCase())); }
  private links(message: string): string[] { return [...new Set(message.match(/https?:\/\/[^\s),]+/gi) ?? [])]; }
  private tags(message: string): string[] { return [...new Set((message.match(/#([\w-]+)/g) ?? []).map((tag) => tag.slice(1)))]; }
  private checklist(message: string): string[] { return (message.match(/(?:^|\n)\s*[-*]\s+(.+)/g) ?? []).map((item) => item.replace(/(?:^|\n)\s*[-*]\s+/, '').trim()); }
  private category(message: string): string | undefined { return this.value(message, /\b(internship|hackathon|competition|fellowship|scholarship|workshop)\b/i); }
  private status(message: string): string | undefined { return this.value(message, /\b(saved|planned|applied|under review|shortlisted|interview|selected|rejected|completed)\b/i); }
  private dateAfter(message: string, marker: RegExp): string | undefined { const match = message.match(marker); if (!match) return undefined; const value = message.slice(match.index! + match[0].length).match(/^(today|tomorrow|next monday|\d{4}-\d{2}-\d{2}|\d{1,2}\s+[A-Za-z]+|[A-Za-z]+\s+\d{1,2})/i)?.[1]; return value ? this.normalizeDate(value) : undefined; }
  private normalizeDate(value: string): string | undefined { const today = new Date(); if (/^today$/i.test(value)) return today.toISOString().slice(0, 10); if (/^tomorrow$/i.test(value)) { today.setDate(today.getDate() + 1); return today.toISOString().slice(0, 10); } if (/^next monday$/i.test(value)) { today.setDate(today.getDate() + ((8 - today.getDay()) % 7 || 7)); return today.toISOString().slice(0, 10); } const parsed = new Date(value); return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString().slice(0, 10); }
}
