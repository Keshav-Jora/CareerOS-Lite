import type { ActionIntent } from './IntentService';
import type { ActionEntity } from './EntityRecognitionService';
import { logOpportunityDebug } from '../../../utils/opportunityDebug';

export type ExtractedPayload = Record<string, unknown>;
const knownSkills = ['DSA', 'SQL', 'React', 'Docker', 'AWS', 'TypeScript', 'JavaScript', 'Python', 'Java', 'Node.js', 'Git', 'Cloud'];

/** Pure, entity-scoped natural-language extraction. Validation and persistence are separate stages. */
export class ExtractionService {
  extract(message: string, _intent: ActionIntent | null, entity: ActionEntity | null): ExtractedPayload {
    if (!entity) {
      const result = {};
      logOpportunityDebug('ExtractionService', 'src/services/ai/understanding/ExtractionService.ts', 'extract', { message, intent: _intent, entity }, result);
      return result;
    }
    const base = { skills: this.skills(message), links: this.links(message), tags: this.tags(message), checklist: this.checklist(message) };
    let result: ExtractedPayload;
    if (entity === 'opportunity') result = this.opportunity(message, base, _intent);
    else if (entity === 'project') result = { ...base, title: this.title(message), description: this.value(message, /\bdescription\s*[:\-]?\s*([^\n]+)/i), technologies: this.skills(message), status: this.status(message), repository: this.links(message).find((link) => /github\.com/i.test(link)), demo: this.links(message).find((link) => !/github\.com/i.test(link)) };
    else if (entity === 'goal') result = { ...this.goalRename(message), title: this.goalTitle(message), targetDate: this.dateAfter(message, /\b(?:by|target date|deadline)\s*(?:is|on|:)?\s*/i), priority: this.value(message, /\bpriority\s*[:\-]?\s*(high|medium|low)/i), notes: this.value(message, /\bnotes?\s*[:\-]?\s*([^\n]+)/i) };
    else if (entity === 'skill') result = { name: this.value(message, /\b(?:add|learn|skill)\s+([A-Za-z0-9.+#-]+)/i) ?? this.skills(message)[0], level: this.value(message, /\b(beginner|intermediate|advanced)\b/i) };
    else if (entity === 'mission') result = this.parsedMission(message, base);
    else if (entity === 'journey') result = this.journey(message);
    else if (entity === 'progress') result = this.progress(message);
    else if (entity === 'note') result = { ...base, title: this.noteTitle(message) };
    else result = { ...base, title: this.title(message) };
    logOpportunityDebug('ExtractionService', 'src/services/ai/understanding/ExtractionService.ts', 'extract', { message, intent: _intent, entity }, result);
    return result;
  }

  private title(message: string): string | undefined { return this.label(message, ['title']) ?? this.value(message, /\b(?:add|create|update|delete|remove|archive|registered for|track)\s+(?!a new opportunity\b|new opportunity\b|opportunity\b|project\b)([^\n.]+)/i); }
  private mission(message: string, base: ExtractedPayload): ExtractedPayload {
    return { ...base, title: 'Today’s Mission', tasks: this.bullets(this.section(message, 'tasks') ?? message), duration: this.value(message, /\b(?:duration|estimated time)\s*:\s*([^\n]+)/i), priority: this.value(message, /\bpriority\s*:\s*(high|medium|low)/i) };
  }
  private missionTasks(message: string): string[] {
    const bullets = this.bullets(this.section(message, 'tasks') ?? message);
    if (bullets.length) return bullets;
    return message.split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !/^today'?s mission\b|^tasks\b|^(?:duration|estimated time|priority)\s*:/i.test(line));
  }
  private goalTitle(message: string): string | undefined {
    const rename = this.goalRename(message);
    if (typeof rename.title === 'string') return rename.title;
    const labelled = this.label(message, ['title']);
    if (labelled) return labelled;
    const natural = this.value(message, /\b(?:my goal is|i want|i aim to|my dream is|help me get)\s+([^\n.]+)/i);
    if (natural) return natural.replace(/^to\s+/i, '').replace(/^an?\s+/i, '').replace(/^a\s+/i, '').replace(/^become\s+/i, '').replace(/\b(?:at|for)\s+$/i, '').replace(/\b\w/g, (letter) => letter.toUpperCase());
    const inline = this.value(message, /\b(?:create|add|update|modify|change|delete|remove|cancel)\s+(?:a\s+)?goal\s*[:\-]?\s*([^\n]+)/i);
    if (inline && !/^goal$/i.test(inline)) return inline;
    return message.split(/\r?\n/).map((line) => line.trim()).find((line) => line && !/^create\s+(?:a\s+)?goal\b/i.test(line));
  }
  private goalRename(message: string): ExtractedPayload {
    const match = message.match(/\brename\s+(?:the\s+)?(?:goal\s+)?(.+?)\s+(?:to|as)\s+(.+?)\s*[.!]?\s*$/i);
    return match ? { previousTitle: match[1].trim(), title: match[2].trim() } : {};
  }
  private noteTitle(message: string): string | undefined {
    const labelled = this.label(message, ['title']);
    if (labelled) return labelled;
    const match = message.match(/\b(?:delete|remove|update|edit)\s+(?:the\s+)?note\s+(?!$)(.+?)\s*[.!]?\s*$/i);
    return match?.[1]?.trim();
  }
  private progress(message: string): ExtractedPayload {
    const numberAfter = (expression: RegExp): number | undefined => {
      const value = message.match(expression)?.[1];
      return value === undefined ? undefined : Number(value);
    };
    return {
      dsaQuestions: numberAfter(/\b(\d+)\s+(?:DSA\s+)?questions?\b/i),
      codingHours: numberAfter(/\b(\d+(?:\.\d+)?)\s*(?:hours?|hrs?)\s+(?:of\s+)?coding\b/i),
      webDevHours: numberAfter(/\b(\d+(?:\.\d+)?)\s*(?:hours?|hrs?)\s+(?:of\s+)?(?:web\s*dev|web development)\b/i),
      pythonHours: numberAfter(/\b(\d+(?:\.\d+)?)\s*(?:hours?|hrs?)\s+(?:of\s+)?python\b/i),
      applicationsCount: numberAfter(/\b(\d+)\s+applications?\b/i),
      readingMinutes: numberAfter(/\b(\d+)\s+minutes?\s+(?:of\s+)?reading\b/i),
      projectsHours: numberAfter(/\b(\d+(?:\.\d+)?)\s*(?:hours?|hrs?)\s+(?:of\s+)?projects?\b/i),
    };
  }
  private parsedMission(message: string, base: ExtractedPayload): ExtractedPayload {
    const lines = message.split(/\r?\n/).map((line) => line.trim());
    const tasks: string[] = [];
    let metadataStarted = false;
    for (const line of lines) {
      if (!line || /^today'?s mission\b|^today i need to\b|^tasks\s*:?$/i.test(line)) continue;
      if (/^(?:duration|estimated time|priority|notes)\s*:?/i.test(line) || /^\d+\s*(?:min(?:ute)?s?|hours?|h)$/i.test(line) || /^(?:high|medium|low)\s+priority$/i.test(line)) { metadataStarted = true; continue; }
      if (!metadataStarted) tasks.push(line.replace(/^[-*]\s*/, ''));
    }
    const field = (labels: string[]) => {
      const expression = new RegExp(`^\\s*(?:${labels.join('|')})\\s*:?\\s*(.*)$`, 'i');
      for (let index = 0; index < lines.length; index += 1) {
        const match = lines[index].match(expression);
        if (!match) continue;
        return match[1].trim() || lines.slice(index + 1).find((line) => line && !/^(?:duration|estimated time|priority|notes)\s*:?/i.test(line));
      }
      return undefined;
    };
    const bareDuration = lines.find((line) => /^\d+\s*(?:min(?:ute)?s?|hours?|h)$/i.test(line));
    const barePriority = lines.find((line) => /^(?:high|medium|low)\s+priority$/i.test(line))?.match(/^(high|medium|low)/i)?.[1];
    const priority = field(['priority']) ?? barePriority;
    return { ...base, title: 'Today’s Mission', tasks, duration: field(['duration', 'estimated time']) ?? bareDuration, priority: priority ? `${priority.charAt(0).toUpperCase()}${priority.slice(1).toLowerCase()}` : undefined, notes: field(['notes']) };
  }
  private journey(message: string): ExtractedPayload {
    const title = message
      .replace(/^\s*(?:i\s+)?(?:completed|finished|built)\s+/i, '')
      .replace(/[.!]+$/, '')
      .replace(/\s+(?:today|yesterday)$/i, '')
      .replace(/\s+certification$/i, '')
      .trim();
    const journeyType = /\b(certification|certificate|foundations?)\b/i.test(message)
      ? 'Certification'
      : /\b(internship|fellowship|job)\b/i.test(message)
        ? 'Internship'
        : /\b(course|training|learned|learning)\b/i.test(message)
          ? 'Learning'
          : /\b(built|project|dashboard|portfolio)\b/i.test(message)
            ? 'Project'
            : 'Achievement';
    const date = this.dateAfter(message, /\b(?:on|completed|finished|built)\s*/i) ?? this.normalizeDate('today');
    return {
      title: title || 'Career milestone',
      journeyType,
      status: 'Completed',
      date,
      certificates: journeyType === 'Certification' ? [title] : [],
      built: journeyType === 'Project' ? title : '',
      achievements: journeyType === 'Internship' || journeyType === 'Achievement' ? `Completed ${title}.` : '',
      learned: journeyType === 'Certification' || journeyType === 'Learning' ? `Completed ${title}.` : '',
      applications: [],
      codingPractice: '',
      isMajorMilestone: true,
    };
  }
  private opportunity(message: string, base: ExtractedPayload, intent: ActionIntent | null): ExtractedPayload {
    const fields = this.sections(message);
    const skills = this.sectionArray(fields.skills) ?? base.skills;
    const checklist = this.sectionArray(fields.checklist) ?? base.checklist;
    const tags = this.sectionArray(fields.tags, true) ?? base.tags;
    const portal = fields.portal ?? fields['application url'] ?? this.links(message)[0];
    const referenceTitle = intent === 'update' ? this.updateOpportunityTitle(message) : undefined;
    return { ...base, title: fields.title ?? fields.role ?? referenceTitle ?? this.naturalOpportunityTitle(message) ?? this.title(message), organization: fields.company ?? fields.organization ?? fields.employer ?? this.naturalOrganization(message), category: this.normalizeCategory(fields.category) ?? this.category(message), source: fields.platform, priority: this.normalizePriority(fields.priority) ?? this.priority(message), status: fields.status, deadline: fields.deadline ? this.normalizeDate(fields.deadline) : this.updateDeadline(message) ?? this.dateAfter(message, /\bdeadline\s*(?:is|on|:)?\s*/i), skills, checklist, tags, eligibility: fields.eligibility, resumeVersion: fields.resume, applicationLink: portal, officialLink: portal, notes: fields['preparation notes'] ?? fields.notes };
  }
  private updateOpportunityTitle(message: string): string | undefined {
    const match = message.match(/^(?:the\s+)?(.+?)\s+(?:deadline|priority|status)\s+(?:changed|change|moved|move|updated|update|is)\b/i)?.[1];
    return match?.replace(/^(?:my|the)\s+/i, '').trim();
  }
  private updateDeadline(message: string): string | undefined {
    const value = message.match(/\bdeadline\s+(?:changed|change|moved|move|updated|update)\s+(?:to\s+)?(today|tomorrow|next monday|\d{4}-\d{2}-\d{2}|\d{1,2}\s+[A-Za-z]+(?:\s*,?\s*\d{4})?|[A-Za-z]+\s+\d{1,2}(?:,?\s*\d{4})?)/i)?.[1];
    return value ? this.normalizeDate(value) : undefined;
  }
  private naturalOpportunityTitle(message: string): string | undefined {
    const sentences = message.split(/\r?\n|(?<=[.!])\s+/).map((line) => line.trim()).filter(Boolean);
    const explicit = sentences.find((line) => /\b(?:intern(?:ship)?|engineer|developer|fellowship|scholarship|job|role|opportunity)\b/i.test(line) && !/^(?:save|track|remember|store|add|i found|i want to apply)/i.test(line));
    if (explicit) return explicit.replace(/^(?:title|role)\s+is\s+/i, '').replace(/\s+at\s+[^.]+$/i, '').replace(/[.!]+$/, '').trim();
    const found = message.match(/\b(?:found|save|track|remember|store)\s+(?:a|this|an)?\s*([A-Z][A-Za-z0-9& .-]*(?:internship|intern|job|fellowship|scholarship))/i)?.[1];
    return found?.replace(/[.!]+$/, '').trim();
  }
  private naturalOrganization(message: string): string | undefined {
    const atCompany = message.match(/\bat\s+([A-Z][A-Za-z0-9& .-]+?)(?:[.!\n]|$)/)?.[1]?.trim();
    if (atCompany) return atCompany;
    const namedCompany = message.match(/\b(Google|Microsoft|Amazon|Meta|Apple|Netflix|Flipkart|Deloitte|Oracle|IBM)\b/i)?.[1];
    return namedCompany;
  }
  private priority(message: string): string | undefined { return this.normalizePriority(this.value(message, /\b(?:priority\s*(?:is\s*)?|)(high|medium|low|urgent)\b/i) ?? (/\burgent\b/i.test(message) ? 'urgent' : undefined)); }
  private normalizePriority(value: string | undefined): string | undefined { if (!value) return undefined; const normalized = value.trim().toLowerCase(); return normalized === 'urgent' || normalized === 'high' ? 'High' : normalized === 'medium' ? 'Medium' : normalized === 'low' ? 'Low' : undefined; }
  private sections(message: string): Record<string, string> {
    const labels = ['title', 'role', 'company', 'organization', 'category', 'platform', 'priority', 'status', 'deadline', 'skills', 'eligibility', 'checklist', 'resume', 'tags', 'portal', 'application url', 'preparation notes', 'notes'];
    const expression = new RegExp(`^\\s*(${labels.join('|')})\\s*:\\s*(.*)$`, 'i'); const result: Record<string, string> = {}; let active: string | undefined;
    for (const line of message.split(/\r?\n/)) { const match = line.match(expression); if (match) { active = match[1].toLowerCase(); result[active] = match[2].trim(); } else if (active && line.trim()) result[active] = `${result[active]}${result[active] ? '\n' : ''}${line.trim()}`; }
    return result;
  }
  private sectionArray(value: string | undefined, hashtag = false): string[] | undefined { if (value === undefined) return undefined; return value.split(/\n|,/).map((item) => item.replace(/^[-*]\s*/, '').replace(/^#/, '').trim()).filter(Boolean).map((item) => hashtag ? item.replace(/^#/, '') : item); }
  private normalizeCategory(value: string | undefined): string | undefined {
    if (!value) return undefined;
    const normalized = value.trim().toLowerCase().replace(/\s+/g, ' ');
    const aliases: Record<string, string> = {
      intern: 'Internship',
      internship: 'Internship',
      job: 'Job',
      scholarship: 'Scholarship',
      fellowship: 'Fellowship',
      competition: 'Competition',
      volunteer: 'Volunteer',
      'open source': 'Open Source Program',
      'open source program': 'Open Source Program',
      oss: 'Open Source Program',
      training: 'Training',
      bootcamp: 'Bootcamp',
    };
    return aliases[normalized] ?? normalized.replace(/\b\w/g, (letter) => letter.toUpperCase());
  }
  private label(message: string, labels: string[]): string | undefined { const expression = new RegExp(`(?:^|\\n)\\s*(?:${labels.join('|')})\\s*:\\s*([^\\n]+)`, 'i'); return this.value(message, expression); }
  private value(message: string, expression: RegExp): string | undefined { return message.match(expression)?.[1]?.trim(); }
  private skills(message: string): string[] { const section = this.section(message, 'skills'); const source = section ?? message; const lower = source.toLowerCase(); return [...new Set(knownSkills.filter((skill) => lower.includes(skill.toLowerCase())).concat(section ? this.bullets(section) : []))]; }
  private links(message: string): string[] { return [...new Set(message.match(/https?:\/\/[^\s),]+/gi) ?? [])]; }
  private tags(message: string): string[] { return [...new Set((message.match(/#([\w-]+)/g) ?? []).map((tag) => tag.slice(1)))]; }
  private checklist(message: string): string[] { return this.bullets(this.section(message, 'checklist') ?? message); }
  private bullets(message: string): string[] { return (message.match(/(?:^|\n)\s*[-*]\s+(.+)/g) ?? []).map((item) => item.replace(/(?:^|\n)\s*[-*]\s+/, '').trim()); }
  private section(message: string, label: string): string | undefined { const match = message.match(new RegExp(`(?:^|\\n)\\s*${label}\\s*:\\s*([\\s\\S]*?)(?=\\n\\s*[A-Za-z ]+\\s*:|$)`, 'i')); return match?.[1]; }
  private category(message: string): string | undefined {
    const labelled = this.label(message, ['category']);
    if (labelled) return this.normalizeCategory(labelled);
    const detected = ['open source program', 'open source', 'oss', 'internship', 'intern', 'hackathon', 'job', 'scholarship', 'fellowship', 'competition', 'volunteer', 'training', 'bootcamp', 'course', 'research', 'startup']
      .find((category) => new RegExp(`\\b${category.replaceAll(' ', '\\s+')}\\b`, 'i').test(message));
    return this.normalizeCategory(detected);
  }
  private status(message: string): string | undefined { return this.value(message, /\b(saved|planned|applied|under review|shortlisted|interview|selected|rejected|completed)\b/i); }
  private dateAfter(message: string, marker: RegExp): string | undefined { const match = message.match(marker); if (!match) return undefined; const value = message.slice(match.index! + match[0].length).match(/^(today|tomorrow|next monday|\d{4}-\d{2}-\d{2}|\d{1,2}\s+[A-Za-z]+(?:\s*,?\s*\d{4})?|[A-Za-z]+\s+\d{1,2}(?:,?\s*\d{4})?)/i)?.[1]; return value ? this.normalizeDate(value) : undefined; }
  private normalizeDate(value: string): string | undefined {
    const today = new Date();
    if (/^today$/i.test(value)) return this.isoDate(today);
    if (/^tomorrow$/i.test(value)) { today.setDate(today.getDate() + 1); return this.isoDate(today); }
    if (/^next monday$/i.test(value)) { today.setDate(today.getDate() + ((8 - today.getDay()) % 7 || 7)); return this.isoDate(today); }

    const input = value.trim();
    const iso = input.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (iso) return this.validIsoDate(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));

    const named = input.match(/^(?:(\d{1,2})\s+([A-Za-z]+)|([A-Za-z]+)\s+(\d{1,2}))(?:,?\s+(\d{4}))?$/);
    if (!named) return undefined;

    const day = Number(named[1] ?? named[4]);
    const monthName = (named[2] ?? named[3]).toLowerCase();
    const month = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'].findIndex((name) => name.startsWith(monthName));
    if (month < 0) return undefined;

    const explicitYear = named[5] ? Number(named[5]) : undefined;
    let year = explicitYear ?? today.getFullYear();
    let normalized = this.validIsoDate(year, month, day);
    if (!normalized) return undefined;

    // A yearless deadline belongs to the current application cycle. If that date
    // has passed, it refers to the next cycle—not JavaScript's arbitrary 2001 default.
    if (!explicitYear && normalized < this.isoDate(today)) {
      year += 1;
      normalized = this.validIsoDate(year, month, day);
    }
    return normalized;
  }
  private validIsoDate(year: number, month: number, day: number): string | undefined {
    const candidate = new Date(year, month, day);
    return candidate.getFullYear() === year && candidate.getMonth() === month && candidate.getDate() === day ? this.isoDate(candidate) : undefined;
  }
  private isoDate(value: Date): string { return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`; }
}
