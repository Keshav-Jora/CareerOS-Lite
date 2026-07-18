import type { ActionIntent } from './IntentService';
import type { ActionEntity } from './EntityRecognitionService';

export type ExtractedPayload = Record<string, unknown>;
const knownSkills = ['DSA', 'SQL', 'React', 'Docker', 'AWS', 'TypeScript', 'JavaScript', 'Python', 'Java', 'Node.js', 'Git', 'Cloud'];

/** Pure, entity-scoped natural-language extraction. Validation and persistence are separate stages. */
export class ExtractionService {
  extract(message: string, _intent: ActionIntent | null, entity: ActionEntity | null): ExtractedPayload {
    if (!entity) return {};
    const base = { skills: this.skills(message), links: this.links(message), tags: this.tags(message), checklist: this.checklist(message) };
    if (entity === 'opportunity') return { ...base, title: this.title(message), organization: this.label(message, ['organization', 'company', 'employer']), category: this.category(message), status: this.status(message), priority: this.label(message, ['priority']) ?? this.value(message, /\bpriority\s+(high|medium|low)/i), stage: this.label(message, ['stage', 'round']), applicationDate: this.dateAfter(message, /\b(?:applied|registered)(?:\s+on)?\s+/i), deadline: this.dateAfter(message, /\bdeadline\s*(?:is|on|:)?\s*/i), location: this.label(message, ['location']), officialLink: this.links(message)[0] };
    if (entity === 'project') return { ...base, title: this.title(message), description: this.value(message, /\bdescription\s*[:\-]?\s*([^\n]+)/i), technologies: this.skills(message), status: this.status(message), repository: this.links(message).find((link) => /github\.com/i.test(link)), demo: this.links(message).find((link) => !/github\.com/i.test(link)) };
    if (entity === 'goal') return { title: this.title(message), targetDate: this.dateAfter(message, /\b(?:by|target date|deadline)\s*(?:is|on|:)?\s*/i), priority: this.value(message, /\bpriority\s*[:\-]?\s*(high|medium|low)/i), notes: this.value(message, /\bnotes?\s*[:\-]?\s*([^\n]+)/i) };
    if (entity === 'skill') return { name: this.value(message, /\b(?:add|learn|skill)\s+([A-Za-z0-9.+#-]+)/i) ?? this.skills(message)[0], level: this.value(message, /\b(beginner|intermediate|advanced)\b/i) };
    return { ...base, title: this.title(message) };
  }

  private title(message: string): string | undefined { return this.label(message, ['title']) ?? this.value(message, /\b(?:add|create|update|registered for|track)\s+(?!a new opportunity\b|new opportunity\b|opportunity\b|project\b)([^\n.]+)/i); }
  private label(message: string, labels: string[]): string | undefined { const expression = new RegExp(`(?:^|\\n)\\s*(?:${labels.join('|')})\\s*:\\s*([^\\n]+)`, 'i'); return this.value(message, expression); }
  private value(message: string, expression: RegExp): string | undefined { return message.match(expression)?.[1]?.trim(); }
  private skills(message: string): string[] { const section = this.section(message, 'skills'); const source = section ?? message; const lower = source.toLowerCase(); return [...new Set(knownSkills.filter((skill) => lower.includes(skill.toLowerCase())).concat(section ? this.bullets(section) : []))]; }
  private links(message: string): string[] { return [...new Set(message.match(/https?:\/\/[^\s),]+/gi) ?? [])]; }
  private tags(message: string): string[] { return [...new Set((message.match(/#([\w-]+)/g) ?? []).map((tag) => tag.slice(1)))]; }
  private checklist(message: string): string[] { return this.bullets(this.section(message, 'checklist') ?? message); }
  private bullets(message: string): string[] { return (message.match(/(?:^|\n)\s*[-*]\s+(.+)/g) ?? []).map((item) => item.replace(/(?:^|\n)\s*[-*]\s+/, '').trim()); }
  private section(message: string, label: string): string | undefined { const match = message.match(new RegExp(`(?:^|\\n)\\s*${label}\\s*:\\s*([\\s\\S]*?)(?=\\n\\s*[A-Za-z ]+\\s*:|$)`, 'i')); return match?.[1]; }
  private category(message: string): string | undefined { const value = this.label(message, ['category']) ?? this.value(message, /\b(internship|hackathon|job|competition|scholarship|course|research|volunteer|startup)\b/i); return value ? value.replace(/\b\w/g, (letter) => letter.toUpperCase()) : undefined; }
  private status(message: string): string | undefined { return this.value(message, /\b(saved|planned|applied|under review|shortlisted|interview|selected|rejected|completed)\b/i); }
  private dateAfter(message: string, marker: RegExp): string | undefined { const match = message.match(marker); if (!match) return undefined; const value = message.slice(match.index! + match[0].length).match(/^(today|tomorrow|next monday|\d{4}-\d{2}-\d{2}|\d{1,2}\s+[A-Za-z]+(?:\s*,?\s*\d{4})?|[A-Za-z]+\s+\d{1,2}(?:,?\s*\d{4})?)/i)?.[1]; return value ? this.normalizeDate(value) : undefined; }
  private normalizeDate(value: string): string | undefined { const today = new Date(); if (/^today$/i.test(value)) return this.isoDate(today); if (/^tomorrow$/i.test(value)) { today.setDate(today.getDate() + 1); return this.isoDate(today); } if (/^next monday$/i.test(value)) { today.setDate(today.getDate() + ((8 - today.getDay()) % 7 || 7)); return this.isoDate(today); } const parsed = new Date(value); return Number.isNaN(parsed.getTime()) ? undefined : this.isoDate(parsed); }
  private isoDate(value: Date): string { return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`; }
}
