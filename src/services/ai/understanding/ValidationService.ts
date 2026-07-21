import type { ActionIntent } from './IntentService';
import type { ActionEntity } from './EntityRecognitionService';
import type { ExtractedPayload } from './ExtractionService';

export type ValidationCode = 'required' | 'invalid-format' | 'invalid-value' | 'unsupported';
export interface ActionValidationIssue { field?: string; code: ValidationCode; message: string; }
export interface ActionValidation { valid: boolean; normalized: boolean; issues: ActionValidationIssue[]; }

const priorities = new Set(['High', 'Medium', 'Low']);
const statuses = new Set(['Saved', 'Planned', 'Applied', 'Under Review', 'Shortlisted', 'Interview', 'Selected', 'Rejected', 'Completed']);
const categories = new Set(['Internship', 'Hackathon', 'Job', 'Scholarship', 'Fellowship', 'Competition', 'Volunteer', 'Open Source Program', 'Training', 'Bootcamp', 'Quiz', 'Workshop', 'Certification', 'Course', 'Research', 'Startup']);
const categoryList = [...categories].join(', ');

/** Validates extracted values only; payload persistence and execution remain separate stages. */
export class ValidationService {
  validate(intent: ActionIntent | null, entity: ActionEntity | null, payload: ExtractedPayload): ActionValidation {
    const issues: ActionValidationIssue[] = [];
    if (!entity || !intent) {
      const action = intent === 'delete' ? 'delete' : intent === 'update' ? 'update' : 'complete';
      const result: ActionValidation = { valid: false, normalized: false, issues: [{ code: 'unsupported', message: `I couldn't determine which item you want to ${action}. Please specify its title.` }] };
      return result;
    }
    const requiresTitle = intent === 'create' || (intent === 'update' && entity !== 'opportunity');
    if (requiresTitle && ['opportunity', 'project', 'goal', 'skill'].includes(entity) && !this.text(payload.title ?? payload.name)) issues.push({ field: 'title', code: 'required', message: 'A title is required.' });
    this.date(payload, 'deadline', issues); this.date(payload, 'applicationDate', issues); this.date(payload, 'targetDate', issues);
    this.enum(payload, 'priority', priorities, issues); this.enum(payload, 'status', statuses, issues); this.category(payload, issues);
    this.url(payload, 'officialLink', issues); this.url(payload, 'repository', issues); this.url(payload, 'demo', issues);
    this.array(payload, 'checklist', issues); this.array(payload, 'skills', issues); this.array(payload, 'tags', issues);
    const result: ActionValidation = { valid: issues.length === 0, normalized: issues.length === 0, issues };
    return result;
  }
  private text(value: unknown): boolean { return typeof value === 'string' && value.trim().length > 0; }
  private date(payload: ExtractedPayload, field: string, issues: ActionValidationIssue[]): void { const value = payload[field]; if (value !== undefined && (!this.text(value) || Number.isNaN(new Date(value as string).getTime()))) issues.push({ field, code: 'invalid-value', message: `${field} could not be parsed.` }); }
  private enum(payload: ExtractedPayload, field: string, values: Set<string>, issues: ActionValidationIssue[]): void { const value = payload[field]; if (value !== undefined && (!this.text(value) || !values.has(this.normalize(String(value))))) issues.push({ field, code: 'invalid-value', message: `${field} is not supported.` }); }
  private category(payload: ExtractedPayload, issues: ActionValidationIssue[]): void { const value = payload.category; if (value !== undefined && (!this.text(value) || !categories.has(this.normalize(String(value))))) issues.push({ field: 'category', code: 'invalid-value', message: `I don't recognize that category. Supported categories are: ${categoryList}.` }); }
  private url(payload: ExtractedPayload, field: string, issues: ActionValidationIssue[]): void { const value = payload[field]; if (value !== undefined && this.text(value)) { try { new URL(value as string); } catch { issues.push({ field, code: 'invalid-format', message: `${field} must be a valid URL.` }); } } }
  private array(payload: ExtractedPayload, field: string, issues: ActionValidationIssue[]): void { const value = payload[field]; if (value !== undefined && (!Array.isArray(value) || value.some((item) => !this.text(item)))) issues.push({ field, code: 'invalid-format', message: `${field} must be a string array.` }); }
  private normalize(value: string): string { return value.trim().toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase()); }
}
