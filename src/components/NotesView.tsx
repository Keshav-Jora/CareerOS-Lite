import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  FileText,
  Search,
  Plus,
  Trash2,
  Pin,
  Tag,
  Calendar,
  CheckCircle,
  Eye,
  Edit,
  Check,
  Sparkles,
  ChevronLeft,
  List,
  Bold,
  Heading,
  ListTodo,
  Code,
  BookOpen,
} from 'lucide-react';
import { Note } from '../types';

interface NotesViewProps {
  theme: 'light' | 'dark';
  notes: Note[];
  onSaveNote: (note: Note) => void;
  onDeleteNote: (id: string) => void;
}

export default function NotesView({ theme, notes, onSaveNote, onDeleteNote }: NotesViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(
    notes.length > 0 ? notes[0].id : null
  );
  const [isEditing, setIsEditing] = useState(false);
  const [mobileViewMode, setMobileViewMode] = useState<'list' | 'detail'>('list');

  // Editor states
  const [editorTitle, setEditorTitle] = useState('');
  const [editorContent, setEditorContent] = useState('');
  const [editorTagsRaw, setEditorTagsRaw] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  const activeNote = notes.find((n) => n.id === selectedNoteId);

  // Quick markdown snippet appender for mobile toolbar
  const handleAppendMarkdownSnippet = (snippet: string) => {
    setEditorContent((prev) => (prev ? `${prev}\n${snippet}` : snippet));
  };

  // Template quick insert generator
  const handleInsertTemplate = (type: 'dsa' | 'cover' | 'pitch') => {
    let tpl = '';
    if (type === 'dsa') {
      tpl = `### [LeetCode] Problem Title\n\n- [ ] Solved Independently?\n- **Difficulty**: Medium\n- **Category**: Array / Dynamic Programming\n\n#### Complexity Analysis\n- **Time Complexity**: O(N log N)\n- **Space Complexity**: O(N)\n\n#### Core Intuition\nUsing a fast hash map lookup in a single chronological pass...\n\n\`\`\`typescript\nfunction solve(nums: number[]): number {\n  // Code goes here\n}\n\`\`\``;
    } else if (type === 'cover') {
      tpl = `### Cover Letter Segment\n\nDear [Hiring Manager Name] at [Company Name],\n\nI am incredibly excited to apply for the [Position Name] role. As a student with a graduation date of [Grad Date], I have focused my development efforts on creating production-ready web architectures...\n\nSincerely,\n[Your Name]`;
    } else if (type === 'pitch') {
      tpl = `### My 30-Second Elevator Pitch\n\n- **The Hook**: "I'm a software engineer who loves building highly scalable, user-centric interfaces."\n- **Core Expertise**: React/Vite, TypeScript, Tailwind CSS, Python.\n- **My Project Leverage**: "I built CareerOS Lite, a career platform tracking 20+ applications, timeline metrics, and logs."`;
    }
    setEditorContent(tpl);
  };

  // Initialize editor with active note values
  const startEditing = () => {
    if (!activeNote) return;
    setEditorTitle(activeNote.title);
    setEditorContent(activeNote.content);
    setEditorTagsRaw(activeNote.tags.join(', '));
    setIsEditing(true);
  };

  const handleCreateNote = () => {
    const newNote: Note = {
      id: `note-${Date.now()}`,
      title: 'Untitled Document',
      content: '### New Document\n\n- [ ] Task 1\n- [ ] Task 2\n\nStart writing markdown notes here...',
      tags: ['General'],
      updatedAt: new Date().toISOString(),
      isPinned: false,
    };
    onSaveNote(newNote);
    setSelectedNoteId(newNote.id);
    setEditorTitle(newNote.title);
    setEditorContent(newNote.content);
    setEditorTagsRaw('General');
    setIsEditing(true);
    setMobileViewMode('detail');
  };

  const handleSave = () => {
    if (!selectedNoteId || !activeNote) return;

    const tags = editorTagsRaw
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const updatedNote: Note = {
      ...activeNote,
      title: editorTitle || 'Untitled Document',
      content: editorContent,
      tags,
      updatedAt: new Date().toISOString(),
    };

    onSaveNote(updatedNote);
    setIsEditing(false);
  };

  const handleTogglePin = (note: Note) => {
    onSaveNote({
      ...note,
      isPinned: !note.isPinned,
    });
  };

  // Clickable interactive checklist parser inside Markdown Preview
  const handleToggleCheckboxInContent = (note: Note, lineIndex: number) => {
    const lines = note.content.split('\n');
    const targetLine = lines[lineIndex];

    if (targetLine.includes('- [ ]')) {
      lines[lineIndex] = targetLine.replace('- [ ]', '- [x]');
    } else if (targetLine.includes('- [x]')) {
      lines[lineIndex] = targetLine.replace('- [x]', '- [ ]');
    }

    onSaveNote({
      ...note,
      content: lines.join('\n'),
      updatedAt: new Date().toISOString(),
    });
  };

  // Search filter
  const filteredNotes = notes.filter((n) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch = (
      n.title.toLowerCase().includes(query) ||
      n.content.toLowerCase().includes(query) ||
      n.tags.some((t) => t.toLowerCase().includes(query))
    );
    const matchesTag = selectedTag ? n.tags.includes(selectedTag) : true;
    return matchesSearch && matchesTag;
  });

  const pinnedNotes = filteredNotes.filter((n) => n.isPinned);
  const otherNotes = filteredNotes.filter((n) => !n.isPinned);

  // Custom regex-based high-performance local markdown renderer
  const renderMarkdown = (note: Note) => {
    const lines = note.content.split('\n');

    return lines.map((line, lineIdx) => {
      // Checkbox checklist line parsing
      if (line.trim().startsWith('- [ ]') || line.trim().startsWith('- [x]')) {
        const isChecked = line.includes('- [x]');
        const text = line.replace(/- \[[ x]\]/, '').trim();
        return (
          <div key={lineIdx} className="flex items-center gap-2 py-1 select-none">
            <button
              onClick={() => handleToggleCheckboxInContent(note, lineIdx)}
              className={`h-4 w-4 rounded border flex items-center justify-center transition-colors ${
                isChecked ? 'bg-indigo-600 border-indigo-500 text-white' : 'border-slate-800 bg-slate-950/20 hover:border-slate-700'
              }`}
            >
              {isChecked && <Check className="h-3 w-3" />}
            </button>
            <span className={`text-xs ${isChecked ? 'line-through text-slate-500' : 'text-slate-200'}`}>
              {text}
            </span>
          </div>
        );
      }

      // Headers parsing
      if (line.startsWith('# ')) {
        return (
          <h1 key={lineIdx} className="text-xl font-display font-bold text-slate-100 mt-4 mb-2">
            {line.substring(2)}
          </h1>
        );
      }
      if (line.startsWith('## ')) {
        return (
          <h2 key={lineIdx} className="text-lg font-display font-bold text-slate-100 mt-3.5 mb-1.5">
            {line.substring(3)}
          </h2>
        );
      }
      if (line.startsWith('### ')) {
        return (
          <h3 key={lineIdx} className="text-sm font-semibold text-slate-200 mt-3 mb-1 uppercase tracking-wider">
            {line.substring(4)}
          </h3>
        );
      }

      // Bullet points parsing
      if (line.trim().startsWith('- ')) {
        return (
          <ul key={lineIdx} className="list-disc list-inside ml-4 text-xs text-slate-300 leading-relaxed py-0.5">
            <li>{line.trim().substring(2)}</li>
          </ul>
        );
      }

      // Default blank lines or paragraphs
      if (line.trim() === '') {
        return <div key={lineIdx} className="h-2" />;
      }

      // Standard text formatting (bold / italic)
      let parsedLine = line;
      // Bold (double asterisks)
      parsedLine = parsedLine.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      // Italic (single asterisk)
      parsedLine = parsedLine.replace(/\*(.*?)\*/g, '<em>$1</em>');

      return (
        <p
          key={lineIdx}
          className="text-xs text-slate-300 leading-relaxed py-0.5"
          dangerouslySetInnerHTML={{ __html: parsedLine }}
        />
      );
    });
  };

  return (
    <>
      {/* DESKTOP NOTES VIEW (Hidden on screens < 768px - Frozen & Untouched) */}
      <div className="hidden md:flex max-w-6xl mx-auto h-[calc(100vh-100px)] gap-6 p-1">
        {/* Left Column: Note list sidebar */}
        <div
          className={`w-80 border rounded-2xl flex flex-col justify-between shrink-0 overflow-hidden ${
            theme === 'dark' ? 'glass-panel-dark' : 'glass-panel-light'
          }`}
        >
          {/* Search & Add */}
          <div className="p-4 space-y-3 border-b border-slate-800/20">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-bold text-sm text-slate-200">Notes Drawer</h3>
              <button
                onClick={handleCreateNote}
                className="p-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm transition-colors"
                title="New Document"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            <div className="relative">
              <span className="absolute left-2.5 top-2.5 text-slate-500">
                <Search className="h-3.5 w-3.5" />
              </span>
              <input
                type="text"
                placeholder="Search documents or tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full pl-8 pr-3 py-1.5 rounded-lg border text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none transition-all ${
                  theme === 'dark'
                    ? 'bg-slate-950/40 border-slate-800 text-slate-150 placeholder:text-slate-650'
                    : 'bg-white border-slate-200 text-slate-800'
                }`}
              />
            </div>

            {/* Dynamic Tag Filter Clusters */}
            {Array.from(new Set(notes.flatMap(n => n.tags))).length > 0 && (
              <div className="flex gap-1.5 overflow-x-auto pb-1 select-none">
                <button
                  type="button"
                  onClick={() => setSelectedTag(null)}
                  className={`px-2 py-0.5 rounded text-[9px] font-bold transition-all ${
                    selectedTag === null
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-950/65 border border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  All
                </button>
                {Array.from(new Set(notes.flatMap(n => n.tags))).map(tag => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setSelectedTag(tag)}
                    className={`px-2 py-0.5 rounded text-[9px] font-bold transition-all whitespace-nowrap ${
                      selectedTag === tag
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-950/65 border border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Notes Items List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-3">
            {/* Pinned Notes section */}
            {pinnedNotes.length > 0 && (
              <div className="space-y-1">
                <span className="text-[9px] uppercase tracking-wider text-slate-500 font-bold px-2 flex items-center gap-1">
                  <Pin className="h-3 w-3" /> Pinned Documents
                </span>
                {pinnedNotes.map((note) => (
                  <button
                    key={note.id}
                    onClick={() => {
                      setSelectedNoteId(note.id);
                      setIsEditing(false);
                    }}
                    className={`w-full text-left p-2.5 rounded-xl border transition-all flex flex-col gap-1 ${
                      selectedNoteId === note.id
                        ? 'bg-indigo-600/10 border-indigo-500/20'
                        : theme === 'dark'
                        ? 'bg-transparent border-transparent hover:bg-slate-850/40'
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-2 w-full">
                      <h4 className="font-bold text-xs truncate text-slate-100 flex-1">{note.title}</h4>
                      <Pin className="h-3 w-3 text-indigo-500 shrink-0 fill-current" />
                    </div>
                    <span className="text-[9px] font-mono text-slate-500">
                      {new Date(note.updatedAt).toLocaleDateString()}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {/* Standard Notes */}
            <div className="space-y-1">
              {pinnedNotes.length > 0 && (
                <span className="text-[9px] uppercase tracking-wider text-slate-500 font-bold px-2 block mt-3">
                  All Documents
                </span>
              )}

              {otherNotes.length === 0 && pinnedNotes.length === 0 ? (
                <p className="text-center text-slate-500 text-xs py-8">No matching notes.</p>
              ) : (
                otherNotes.map((note) => (
                  <button
                    key={note.id}
                    onClick={() => {
                      setSelectedNoteId(note.id);
                      setIsEditing(false);
                    }}
                    className={`w-full text-left p-2.5 rounded-xl border transition-all flex flex-col gap-1.5 ${
                      selectedNoteId === note.id
                        ? 'bg-indigo-600/10 border-indigo-500/20'
                        : theme === 'dark'
                        ? 'bg-transparent border-transparent hover:bg-slate-800/40'
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    <h4 className="font-bold text-xs truncate text-slate-100 w-full">{note.title}</h4>
                    <div className="flex items-center justify-between w-full">
                      <span className="text-[9px] font-mono text-slate-500">
                        {new Date(note.updatedAt).toLocaleDateString()}
                      </span>
                      <div className="flex gap-1">
                        {note.tags.slice(0, 1).map((t, idx) => (
                          <span
                            key={idx}
                            className="px-1.5 py-0.5 bg-slate-800 text-[8px] text-slate-400 rounded"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Note Active Canvas (Editor or Reader) */}
        <div
          className={`flex-1 border rounded-2xl flex flex-col justify-between overflow-hidden ${
            theme === 'dark' ? 'glass-panel-dark' : 'glass-panel-light'
          }`}
        >
          {activeNote ? (
            <>
              {/* Top Bar Navigation */}
              <div className="px-5 py-3 border-b border-slate-800/20 flex items-center justify-between bg-slate-900/15">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleTogglePin(activeNote)}
                    className={`p-1.5 rounded-lg border transition-all ${
                      activeNote.isPinned
                        ? 'bg-indigo-600/10 border-indigo-500/30 text-indigo-400'
                        : 'bg-transparent border-slate-800 text-slate-500 hover:text-slate-350'
                    }`}
                    title={activeNote.isPinned ? 'Unpin note' : 'Pin note'}
                  >
                    <Pin className={`h-4.5 w-4.5 ${activeNote.isPinned ? 'fill-current' : ''}`} />
                  </button>
                   <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-mono">
                    <Calendar className="h-3.5 w-3.5" /> Saved:{' '}
                    {new Date(activeNote.updatedAt).toLocaleDateString()}
                    <span className="mx-1">•</span>
                    <span>{activeNote.content.split(/\s+/).filter(Boolean).length} words</span>
                    <span className="mx-1">•</span>
                    <span>{Math.max(1, Math.ceil(activeNote.content.split(/\s+/).filter(Boolean).length / 200))} min read</span>
                  </div>
                </div>

                {/* View/Edit Mode toggler */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      if (isEditing) {
                        handleSave();
                      } else {
                        startEditing();
                      }
                    }}
                    className="px-3.5 py-1.5 rounded-xl border border-slate-800 text-xs font-semibold hover:border-slate-700 text-white bg-slate-900 flex items-center gap-1.5"
                  >
                    {isEditing ? (
                      <>
                        <CheckCircle className="h-3.5 w-3.5 text-emerald-400" /> Save Work
                      </>
                    ) : (
                      <>
                        <Edit className="h-3.5 w-3.5 text-indigo-400" /> Modify Markdown
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => {
                      onDeleteNote(activeNote.id);
                      setSelectedNoteId(notes.length > 0 ? notes[0].id : null);
                      setIsEditing(false);
                    }}
                    className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-rose-500/10 text-slate-500 hover:text-rose-400 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Note Canvas body (Editor or formatted reader) */}
              <div className="flex-1 p-6 overflow-y-auto space-y-4">
                {isEditing ? (
                  <div className="space-y-4 h-full flex flex-col">
                    {/* Title */}
                    <input
                      type="text"
                      value={editorTitle}
                      onChange={(e) => setEditorTitle(e.target.value)}
                      className="w-full text-lg font-display font-bold text-slate-100 bg-transparent border-b border-slate-800 pb-2 focus:outline-none focus:border-indigo-500/50 placeholder:text-slate-700"
                      placeholder="Document Name"
                    />

                    {/* Tags */}
                    <div className="flex items-center gap-2">
                      <Tag className="h-3.5 w-3.5 text-slate-500" />
                      <input
                        type="text"
                        value={editorTagsRaw}
                        onChange={(e) => setEditorTagsRaw(e.target.value)}
                        className="text-xs bg-transparent text-slate-300 focus:outline-none placeholder:text-slate-650 flex-1"
                        placeholder="Tags (comma-separated, e.g. Resume, JobHunt)"
                      />
                    </div>

                    {/* Quick Insert Templates Bar */}
                    <div className="flex flex-wrap items-center gap-2 p-2 rounded-xl bg-slate-950/60 border border-slate-900">
                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider pl-1 mr-1 flex items-center gap-1">
                        <Sparkles className="h-3 w-3 text-indigo-400" /> Insert Knowledge Hub Template:
                      </span>
                      <button
                        type="button"
                        onClick={() => handleInsertTemplate('dsa')}
                        className="px-2 py-1 rounded bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/25 text-[10px] font-bold transition-all cursor-pointer"
                      >
                        + DSA Code Log
                      </button>
                      <button
                        type="button"
                        onClick={() => handleInsertTemplate('cover')}
                        className="px-2 py-1 rounded bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/25 text-[10px] font-bold transition-all cursor-pointer"
                      >
                        + Cover Letter Segment
                      </button>
                      <button
                        type="button"
                        onClick={() => handleInsertTemplate('pitch')}
                        className="px-2 py-1 rounded bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/25 text-[10px] font-bold transition-all cursor-pointer"
                      >
                        + 30s Elevator Pitch
                      </button>
                    </div>

                    {/* Content TextArea */}
                    <textarea
                      value={editorContent}
                      onChange={(e) => setEditorContent(e.target.value)}
                      className="w-full flex-1 bg-transparent text-xs text-slate-200 resize-none focus:outline-none font-mono leading-relaxed"
                      placeholder="Supports Markdown tags (# headers, **bolds**, - [ ] checklists)"
                    />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Heading Title */}
                    <h1 className="font-display font-extrabold text-2xl text-white tracking-tight border-b border-slate-800 pb-3">
                      {activeNote.title}
                    </h1>

                    {/* Tags Display */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {activeNote.tags.map((tag, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-0.5 bg-slate-800/60 border border-slate-700/20 text-[10px] text-slate-400 rounded-full font-medium"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>

                    {/* Custom rendered preview canvas */}
                    <div className="pt-4 space-y-2 markdown-body select-text">
                      {renderMarkdown(activeNote)}
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
              <FileText className="h-10 w-10 text-slate-700 mb-2 animate-pulse" />
              <h4 className="font-bold text-sm text-slate-400">Select or Create a Document</h4>
              <p className="text-xs text-slate-600 max-w-xs mx-auto mt-1">
                Store DSA formulas, cheat sheets, draft cover letter paragraphs, and checklists in our rich markdown sandbox.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* MOBILE NOTES VIEW (Visible ONLY on screens < 768px) */}
      <div className="block md:hidden space-y-5 w-full max-w-xl mx-auto pb-32">
        {mobileViewMode === 'list' || !activeNote ? (
          /* MOBILE NOTE LIST VIEW */
          <div className="space-y-5">
            {/* Mobile Header Card */}
            <div className={`p-5 rounded-2xl border ${theme === 'dark' ? 'glass-panel-dark' : 'glass-panel-light'} space-y-4`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="h-10 w-10 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-sm">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <h1 className="font-display text-xl font-bold text-slate-100">Knowledge Hub</h1>
                    <p className="text-[11px] text-slate-400">Markdown notes, cheat sheets & snippets</p>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCreateNote}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md cursor-pointer transition-all min-h-[44px]"
              >
                <Plus className="h-4 w-4" /> Create New Note
              </button>
            </div>

            {/* Search Input */}
            <div className="relative">
              <span className="absolute left-3.5 top-3.5 text-slate-500">
                <Search className="h-4 w-4" />
              </span>
              <input
                type="text"
                placeholder="Search notes or #tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full pl-10 pr-4 py-3 rounded-xl border text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none transition-all min-h-[44px] ${
                  theme === 'dark'
                    ? 'bg-slate-950/50 border-slate-800 text-slate-100 placeholder:text-slate-500'
                    : 'bg-white border-slate-200 text-slate-800'
                }`}
              />
            </div>

            {/* Dynamic Tag Filter Cluster */}
            {Array.from(new Set(notes.flatMap((n) => n.tags))).length > 0 && (
              <div className="flex gap-2 overflow-x-auto pb-1 select-none no-scrollbar">
                <button
                  type="button"
                  onClick={() => setSelectedTag(null)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-all min-h-[38px] cursor-pointer ${
                    selectedTag === null
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  All Notes ({notes.length})
                </button>
                {Array.from(new Set(notes.flatMap((n) => n.tags))).map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setSelectedTag(tag)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap min-h-[38px] cursor-pointer ${
                      selectedTag === tag
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            )}

            {/* Pinned Documents Section */}
            {pinnedNotes.length > 0 && (
              <div className="space-y-2.5">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1 px-1">
                  <Pin className="h-3 w-3 text-indigo-400 fill-current" /> Pinned Documents ({pinnedNotes.length})
                </span>
                <div className="space-y-2.5">
                  {pinnedNotes.map((note) => (
                    <div
                      key={note.id}
                      onClick={() => {
                        setSelectedNoteId(note.id);
                        setIsEditing(false);
                        setMobileViewMode('detail');
                      }}
                      className={`p-4 rounded-2xl border ${theme === 'dark' ? 'glass-card-dark' : 'glass-card-light'} active:scale-[0.99] transition-all cursor-pointer space-y-2 relative`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="font-bold text-sm text-slate-100 truncate flex-1">{note.title}</h4>
                        <Pin className="h-3.5 w-3.5 text-indigo-400 fill-current shrink-0" />
                      </div>
                      <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                        {note.content.replace(/[#*`\-[\]]/g, '').trim()}
                      </p>
                      <div className="flex items-center justify-between pt-1 border-t border-slate-800/30">
                        <span className="text-[10px] font-mono text-slate-500">
                          {new Date(note.updatedAt).toLocaleDateString()}
                        </span>
                        <div className="flex gap-1">
                          {note.tags.map((t, idx) => (
                            <span key={idx} className="px-2 py-0.5 bg-slate-800 text-[9px] text-slate-300 rounded font-medium">
                              #{t}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Standard Documents Section */}
            <div className="space-y-2.5">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider px-1 block">
                All Documents ({otherNotes.length})
              </span>

              {otherNotes.length === 0 && pinnedNotes.length === 0 ? (
                <div className={`p-8 rounded-2xl border text-center ${theme === 'dark' ? 'glass-panel-dark' : 'glass-panel-light'} space-y-2`}>
                  <FileText className="h-8 w-8 text-slate-600 mx-auto" />
                  <p className="text-xs font-semibold text-slate-400">No matching documents found</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {otherNotes.map((note) => (
                    <div
                      key={note.id}
                      onClick={() => {
                        setSelectedNoteId(note.id);
                        setIsEditing(false);
                        setMobileViewMode('detail');
                      }}
                      className={`p-4 rounded-2xl border ${theme === 'dark' ? 'glass-card-dark' : 'glass-card-light'} active:scale-[0.99] transition-all cursor-pointer space-y-2`}
                    >
                      <h4 className="font-bold text-sm text-slate-100 truncate w-full">{note.title}</h4>
                      <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                        {note.content.replace(/[#*`\-[\]]/g, '').trim()}
                      </p>
                      <div className="flex items-center justify-between pt-1 border-t border-slate-800/30">
                        <span className="text-[10px] font-mono text-slate-500">
                          {new Date(note.updatedAt).toLocaleDateString()}
                        </span>
                        <div className="flex gap-1">
                          {note.tags.map((t, idx) => (
                            <span key={idx} className="px-2 py-0.5 bg-slate-800 text-[9px] text-slate-300 rounded font-medium">
                              #{t}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* MOBILE NOTE DETAIL / EDITOR VIEW */
          <div className="space-y-4">
            {/* Back Button & Control Bar */}
            <div className="flex items-center justify-between gap-2 p-3 rounded-2xl border bg-slate-900/80 border-slate-800/60">
              <button
                type="button"
                onClick={() => setMobileViewMode('list')}
                className="px-3 py-2 rounded-xl bg-slate-800 text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer min-h-[44px]"
              >
                <ChevronLeft className="h-4 w-4" /> All Notes
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleTogglePin(activeNote)}
                  className={`p-2.5 rounded-xl border transition-all min-h-[44px] min-w-[44px] flex items-center justify-center ${
                    activeNote.isPinned
                      ? 'bg-indigo-600/20 border-indigo-500/40 text-indigo-400'
                      : 'bg-slate-800 border-slate-700 text-slate-400'
                  }`}
                  title={activeNote.isPinned ? 'Unpin Note' : 'Pin Note'}
                >
                  <Pin className={`h-4 w-4 ${activeNote.isPinned ? 'fill-current' : ''}`} />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (isEditing) {
                      handleSave();
                    } else {
                      startEditing();
                    }
                  }}
                  className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all min-h-[44px] cursor-pointer"
                >
                  {isEditing ? (
                    <>
                      <CheckCircle className="h-4 w-4 text-emerald-300" /> Save
                    </>
                  ) : (
                    <>
                      <Edit className="h-4 w-4 text-indigo-200" /> Edit
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onDeleteNote(activeNote.id);
                    setSelectedNoteId(notes.length > 0 ? notes[0].id : null);
                    setIsEditing(false);
                    setMobileViewMode('list');
                  }}
                  className="p-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 transition-all min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Main Canvas Card */}
            <div className={`p-5 rounded-2xl border ${theme === 'dark' ? 'glass-panel-dark' : 'glass-panel-light'} space-y-4`}>
              {isEditing ? (
                /* MOBILE EDITOR MODE */
                <div className="space-y-4">
                  {/* Title Input */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Document Name</label>
                    <input
                      type="text"
                      value={editorTitle}
                      onChange={(e) => setEditorTitle(e.target.value)}
                      className="w-full text-base font-display font-bold text-slate-100 bg-slate-950/60 border border-slate-800 rounded-xl p-3 focus:outline-none focus:border-indigo-500 min-h-[44px]"
                      placeholder="Document Name"
                    />
                  </div>

                  {/* Tags Input */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                      <Tag className="h-3 w-3 text-indigo-400" /> Document Tags
                    </label>
                    <input
                      type="text"
                      value={editorTagsRaw}
                      onChange={(e) => setEditorTagsRaw(e.target.value)}
                      className="w-full text-xs text-slate-200 bg-slate-950/60 border border-slate-800 rounded-xl p-3 focus:outline-none focus:border-indigo-500 min-h-[40px]"
                      placeholder="Tags (e.g. Resume, Interview, DSA)"
                    />
                  </div>

                  {/* Knowledge Hub Templates Bar */}
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                      <Sparkles className="h-3 w-3 text-indigo-400" /> Insert Template
                    </span>
                    <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                      <button
                        type="button"
                        onClick={() => handleInsertTemplate('dsa')}
                        className="px-3 py-2 rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-xs font-bold whitespace-nowrap min-h-[40px] cursor-pointer"
                      >
                        + DSA Code Log
                      </button>
                      <button
                        type="button"
                        onClick={() => handleInsertTemplate('cover')}
                        className="px-3 py-2 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-300 text-xs font-bold whitespace-nowrap min-h-[40px] cursor-pointer"
                      >
                        + Cover Letter
                      </button>
                      <button
                        type="button"
                        onClick={() => handleInsertTemplate('pitch')}
                        className="px-3 py-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold whitespace-nowrap min-h-[40px] cursor-pointer"
                      >
                        + Elevator Pitch
                      </button>
                    </div>
                  </div>

                  {/* Touch Quick Markdown Helper Toolbar */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Formatting Shortcuts</span>
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                      <button
                        type="button"
                        onClick={() => handleAppendMarkdownSnippet('### Header Title')}
                        className="px-3 py-2 rounded-xl bg-slate-800 text-slate-200 border border-slate-700 text-xs font-bold flex items-center gap-1 min-h-[38px] whitespace-nowrap cursor-pointer"
                      >
                        <Heading className="h-3.5 w-3.5 text-indigo-400" /> Header
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAppendMarkdownSnippet('**bold text**')}
                        className="px-3 py-2 rounded-xl bg-slate-800 text-slate-200 border border-slate-700 text-xs font-bold flex items-center gap-1 min-h-[38px] whitespace-nowrap cursor-pointer"
                      >
                        <Bold className="h-3.5 w-3.5 text-purple-400" /> Bold
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAppendMarkdownSnippet('- [ ] Checklist task')}
                        className="px-3 py-2 rounded-xl bg-slate-800 text-slate-200 border border-slate-700 text-xs font-bold flex items-center gap-1 min-h-[38px] whitespace-nowrap cursor-pointer"
                      >
                        <ListTodo className="h-3.5 w-3.5 text-emerald-400" /> Checklist
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAppendMarkdownSnippet('```typescript\n// code here\n```')}
                        className="px-3 py-2 rounded-xl bg-slate-800 text-slate-200 border border-slate-700 text-xs font-bold flex items-center gap-1 min-h-[38px] whitespace-nowrap cursor-pointer"
                      >
                        <Code className="h-3.5 w-3.5 text-amber-400" /> Code
                      </button>
                    </div>
                  </div>

                  {/* Content Editor Textarea */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Content (Markdown)</label>
                    <textarea
                      value={editorContent}
                      onChange={(e) => setEditorContent(e.target.value)}
                      className="w-full min-h-[280px] p-4 text-sm font-mono leading-relaxed bg-slate-950/70 border border-slate-800 rounded-2xl text-slate-100 focus:outline-none focus:border-indigo-500"
                      placeholder="Type markdown notes here..."
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleSave}
                    className="w-full py-3.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition-all min-h-[44px] cursor-pointer"
                  >
                    Save & Finish Editing
                  </button>
                </div>
              ) : (
                /* MOBILE READER MODE */
                <div className="space-y-4">
                  {/* Title & Tags */}
                  <div className="border-b border-slate-800/40 pb-3 space-y-2">
                    <h1 className="font-display font-extrabold text-xl text-white tracking-tight">
                      {activeNote.title}
                    </h1>

                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                      <span>Updated: {new Date(activeNote.updatedAt).toLocaleDateString()}</span>
                      <span>{activeNote.content.split(/\s+/).filter(Boolean).length} words</span>
                    </div>

                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {activeNote.tags.map((tag, idx) => (
                        <span key={idx} className="px-2.5 py-1 bg-slate-800 border border-slate-700/40 text-xs text-slate-300 rounded-lg font-medium">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Custom Rendered Markdown Body */}
                  <div className="space-y-2 text-sm text-slate-200 leading-relaxed select-text">
                    {renderMarkdown(activeNote)}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
