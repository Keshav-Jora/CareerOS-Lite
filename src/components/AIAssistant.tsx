import React, { useState, useEffect, useRef, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, X, Send, Bot, User, Zap, Database, Cpu, Menu, MessageSquare, MoreHorizontal, Pencil, Pin, Plus, Search, Trash2 } from 'lucide-react';
import { Opportunity, DailyProgress, TimelineEntry } from '../types';
import { useNovaChat } from '../hooks/useNovaChat';
import type { NovaConversation } from '../types/career-data';

interface AIAssistantProps {
  theme: 'light' | 'dark';
  opportunities: Opportunity[];
  progress: DailyProgress[];
  timeline: TimelineEntry[];
  variant?: 'floating' | 'workspace';
  onActionExecuted?: () => void;
}

/**
 * Custom Markdown Content Renderer
 * Formats Markdown headers, lists, bold text, inline code, and quotes.
 */
const MarkdownText = React.memo(function MarkdownText({ content, isStreaming }: { content: string; isStreaming?: boolean }) {
  const lines = content.split('\n');
  const blocks: ReactNode[] = [];

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const trimmed = line.trim();

    if (trimmed.startsWith('```')) {
      const language = trimmed.slice(3).trim() || 'text';
      const code: string[] = [];
      index += 1;
      while (index < lines.length && !lines[index].trim().startsWith('```')) {
        code.push(lines[index]);
        index += 1;
      }
      blocks.push(<pre key={`code-${index}`} className="my-2 overflow-x-auto rounded-xl border border-slate-700/80 bg-slate-950 p-3 text-[11px] leading-relaxed text-slate-200"><span className="mb-2 block font-mono text-[9px] uppercase tracking-wider text-indigo-300">{language}</span><code>{code.join('\n')}</code></pre>);
      continue;
    }

    if (trimmed.includes('|') && /^\s*\|?\s*:?-{3,}/.test(lines[index + 1] ?? '')) {
      const cells = (value: string) => value.trim().replace(/^\||\|$/g, '').split('|').map((cell) => cell.trim());
      const header = cells(line);
      index += 2;
      const rows: string[][] = [];
      while (index < lines.length && lines[index].includes('|')) {
        rows.push(cells(lines[index]));
        index += 1;
      }
      index -= 1;
      blocks.push(<div key={`table-${index}`} className="my-2 overflow-x-auto rounded-xl border border-slate-800"><table className="w-full min-w-[360px] text-left text-[11px]"><thead className="bg-slate-900/80 text-slate-200"><tr>{header.map((cell, cellIndex) => <th key={cellIndex} className="px-3 py-2 font-semibold">{parseInlineMarkdown(cell)}</th>)}</tr></thead><tbody>{rows.map((row, rowIndex) => <tr key={rowIndex} className="border-t border-slate-800/80 text-slate-300">{header.map((_, cellIndex) => <td key={cellIndex} className="px-3 py-2 align-top">{parseInlineMarkdown(row[cellIndex] ?? '')}</td>)}</tr>)}</tbody></table></div>);
      continue;
    }

    if (!trimmed) {
      blocks.push(<div key={`space-${index}`} className="h-1" />);
      continue;
    }

    const heading = trimmed.match(/^(#{1,3})\s+(.*)$/);
    if (heading) {
      blocks.push(<h4 key={`heading-${index}`} className="mt-1.5 mb-1 flex items-center gap-1 font-display text-xs font-bold text-indigo-400"><Sparkles className="h-3 w-3 text-indigo-400" />{parseInlineMarkdown(heading[2])}</h4>);
      continue;
    }

    const checklist = trimmed.match(/^[-*]\s+\[([ xX])\]\s*(.*)$/);
    if (checklist) {
      blocks.push(<div key={`check-${index}`} className="flex items-start gap-2 pl-1"><span className={`mt-0.5 flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded border text-[9px] ${checklist[1].toLowerCase() === 'x' ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300' : 'border-slate-600 text-transparent'}`}>✓</span><span className={checklist[1].toLowerCase() === 'x' ? 'text-slate-400 line-through' : ''}>{parseInlineMarkdown(checklist[2])}</span></div>);
      continue;
    }

    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      blocks.push(<div key={`bullet-${index}`} className="flex items-start gap-2 pl-1"><span className="mt-0.5 shrink-0 font-bold text-indigo-400">•</span><span className="flex-1">{parseInlineMarkdown(trimmed.replace(/^[-*]\s*/, ''))}</span></div>);
      continue;
    }

    const ordered = trimmed.match(/^(\d+)\.\s*(.*)/);
    if (ordered) {
      blocks.push(<div key={`ordered-${index}`} className="flex items-start gap-2 pl-1"><span className="shrink-0 font-mono text-[11px] font-bold text-indigo-400">{ordered[1]}.</span><span className="flex-1">{parseInlineMarkdown(ordered[2])}</span></div>);
      continue;
    }

    if (trimmed.startsWith('> ')) {
      blocks.push(<div key={`quote-${index}`} className="my-1 rounded-r-lg border-l-2 border-indigo-500/60 bg-indigo-500/5 py-1 pl-2.5 text-[11px] italic text-slate-300">{parseInlineMarkdown(trimmed.replace(/^>\s*/, ''))}</div>);
      continue;
    }

    blocks.push(<p key={`text-${index}`}>{parseInlineMarkdown(line)}</p>);
  }

  return (
    <div className="space-y-1.5 text-xs leading-relaxed font-sans">
      {blocks}

      {/* Blinking Cursor Indicator when Streaming */}
      {isStreaming && (
        <span className="inline-block w-1.5 h-3.5 bg-indigo-400 ml-1 rounded-sm animate-pulse align-middle" />
      )}
    </div>
  );
});

/**
 * Parses inline markdown: **bold**, `code`
 */
function parseInlineMarkdown(text: string) {
  const parts: (string | ReactNode)[] = [];
  let lastIdx = 0;

  // Regex to match **bold** or `code` using hex \x60 for backtick
  const regex = /(\*\*.*?\*\*|\x60[^\x60]+\x60)/g;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIdx) {
      parts.push(text.substring(lastIdx, match.index));
    }

    const matchedStr = match[0];
    if (matchedStr.startsWith('**') && matchedStr.endsWith('**')) {
      parts.push(
        <strong key={match.index} className="font-bold text-slate-100 dark:text-slate-100">
          {matchedStr.slice(2, -2)}
        </strong>
      );
    } else if (matchedStr.startsWith('`') && matchedStr.endsWith('`')) {
      parts.push(
        <code key={match.index} className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-indigo-950/60 text-indigo-300 border border-indigo-800/40">
          {matchedStr.slice(1, -1)}
        </code>
      );
    }
    lastIdx = regex.lastIndex;
  }

  if (lastIdx < text.length) {
    parts.push(text.substring(lastIdx));
  }

  return parts.length > 0 ? parts : text;
}

interface ConversationSidebarProps {
  theme: 'light' | 'dark';
  conversations: NovaConversation[];
  activeConversationId: string | null;
  onNewChat: () => void;
  onSelect: (conversationId: string) => void;
  onRename: (conversationId: string, title: string) => void;
  onDelete: (conversationId: string) => void;
  onTogglePin: (conversationId: string) => void;
}

type ConversationDateGroup = 'Today' | 'Yesterday' | 'Last 7 Days' | 'Older';

function getConversationDateGroup(updatedAt: string): ConversationDateGroup {
  const updated = new Date(updatedAt);
  if (Number.isNaN(updated.getTime())) return 'Older';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  if (updated >= today) return 'Today';
  if (updated >= yesterday) return 'Yesterday';
  if (updated >= sevenDaysAgo) return 'Last 7 Days';
  return 'Older';
}

function conversationPreview(conversation: NovaConversation): string {
  const message = [...conversation.messages].reverse().find((entry) => entry.content.trim());
  const preview = message?.content.replace(/\s+/g, ' ').trim() ?? '';
  return preview.length > 72 ? `${preview.slice(0, 69).trimEnd()}...` : preview || 'No messages yet';
}

function conversationUpdatedAt(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const today = new Date();
  return date.toDateString() === today.toDateString()
    ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function ConversationSidebar({ theme, conversations, activeConversationId, onNewChat, onSelect, onRename, onDelete, onTogglePin, mobile = false }: ConversationSidebarProps & { mobile?: boolean }) {
  const [query, setQuery] = useState('');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const activeItemRef = useRef<HTMLDivElement>(null);
  const normalizedQuery = query.trim().toLowerCase();
  const filteredConversations = conversations.filter((conversation) => !normalizedQuery || conversation.title.toLowerCase().includes(normalizedQuery) || conversationPreview(conversation).toLowerCase().includes(normalizedQuery));
  const panelClass = theme === 'dark' ? 'border-slate-800/80 bg-slate-950/50' : 'border-slate-200 bg-slate-50/80';
  const inputClass = theme === 'dark' ? 'border-slate-800 bg-slate-900/70 text-slate-100 placeholder:text-slate-500' : 'border-slate-200 bg-white text-slate-800 placeholder:text-slate-400';

  const requestRename = (conversation: NovaConversation) => {
    const title = window.prompt('Rename chat', conversation.title);
    if (title?.trim()) onRename(conversation.id, title);
  };

  const requestDelete = (conversation: NovaConversation) => {
    if (window.confirm(`Delete “${conversation.title}”? This only removes the conversation history.`)) onDelete(conversation.id);
  };

  const groups = (['Today', 'Yesterday', 'Last 7 Days', 'Older'] as const).map((label) => ({ label, conversations: filteredConversations.filter((conversation) => getConversationDateGroup(conversation.updatedAt) === label) })).filter((group) => group.conversations.length > 0);

  useEffect(() => { activeItemRef.current?.scrollIntoView({ block: 'nearest' }); }, [activeConversationId]);

  return (
    <aside className={`${mobile ? 'flex' : 'hidden md:flex'} w-60 shrink-0 flex-col border-r p-3 ${panelClass}`} aria-label="Conversation history">
      <button type="button" onClick={onNewChat} className="mb-3 flex w-full items-center justify-center gap-2 rounded-xl border border-indigo-500/40 bg-indigo-500/10 px-3 py-2 text-xs font-semibold text-indigo-300 transition-colors hover:bg-indigo-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500">
        <Plus className="h-3.5 w-3.5" aria-hidden="true" />
        New chat
      </button>
      <label className="relative mb-3 block">
        <span className="sr-only">Search conversations</span>
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" aria-hidden="true" />
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search chats" className={`w-full rounded-lg border py-2 pl-8 pr-2 text-xs outline-none focus:ring-1 focus:ring-indigo-500 ${inputClass}`} />
      </label>
      <div className="min-h-0 flex-1 space-y-1 overflow-y-auto pr-1">
        {filteredConversations.length === 0 ? (
          <p className="px-2 py-4 text-center text-[11px] leading-relaxed text-slate-500">Your saved Nova conversations will appear here.</p>
        ) : groups.map((group) => (
          <section key={group.label} className="pb-3" aria-label={group.label}>
            <p className="mb-1 px-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">{group.label}</p>
            {group.conversations.map((conversation) => {
              const isActive = conversation.id === activeConversationId;
              const isMenuOpen = conversation.id === openMenuId;
              return (
                <div key={conversation.id} ref={isActive ? activeItemRef : undefined} className={`group relative mb-1 rounded-xl ${isActive ? 'bg-indigo-500/15 text-indigo-200' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'}`}>
                  <button type="button" onClick={() => onSelect(conversation.id)} className="w-full min-w-0 px-2 py-2 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500">
                    <span className="flex items-center gap-2 text-xs font-medium"><MessageSquare className="h-3 w-3 shrink-0" aria-hidden="true" /> <span className="truncate">{conversation.title}</span>{conversation.pinned && <Pin className="h-3 w-3 shrink-0 text-indigo-300" aria-label="Pinned" />}</span>
                    <span className="mt-1 flex items-center gap-2 pl-5 text-[10px] text-slate-500"><span className="min-w-0 flex-1 truncate">{conversationPreview(conversation)}</span><span className="shrink-0">{conversationUpdatedAt(conversation.updatedAt)}</span></span>
                  </button>
                  <button type="button" onClick={() => setOpenMenuId(isMenuOpen ? null : conversation.id)} aria-label={`Conversation actions for ${conversation.title}`} aria-expanded={isMenuOpen} className="absolute right-1 top-1 rounded-lg p-1.5 text-slate-500 opacity-0 transition-opacity hover:bg-slate-700/60 hover:text-slate-200 group-hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500"><MoreHorizontal className="h-3.5 w-3.5" /></button>
                  {isMenuOpen && <div className={`absolute right-1 top-8 z-20 w-32 rounded-lg border p-1 shadow-xl ${theme === 'dark' ? 'border-slate-700 bg-slate-900' : 'border-slate-200 bg-white'}`}>
                    <button type="button" onClick={() => { requestRename(conversation); setOpenMenuId(null); }} className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs hover:bg-slate-800/50"><Pencil className="h-3 w-3" /> Rename</button>
                    <button type="button" onClick={() => { onTogglePin(conversation.id); setOpenMenuId(null); }} className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs hover:bg-slate-800/50"><Pin className="h-3 w-3" /> {conversation.pinned ? 'Unpin' : 'Pin'}</button>
                    <button type="button" onClick={() => { requestDelete(conversation); setOpenMenuId(null); }} className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs text-rose-300 hover:bg-rose-500/10"><Trash2 className="h-3 w-3" /> Delete</button>
                  </div>}
                </div>
              );
            })}
          </section>
        ))}
      </div>
    </aside>
  );
}

export default function AIAssistant({ theme, opportunities, progress, timeline, variant = 'floating', onActionExecuted }: AIAssistantProps) {
  const isWorkspace = variant === 'workspace';
  const [isOpen, setIsOpen] = useState(isWorkspace);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const userName = localStorage.getItem('career_os_user_name') || 'Student';
  const { messages, inputText, setInputText, assistantState, sendMessage, conversations, activeConversationId, newChat, selectConversation, renameConversation, deleteConversation, toggleConversationPin } = useNovaChat({
    opportunities,
    progress,
    timeline,
    userName,
  }, onActionExecuted);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, assistantState]);

  /* Legacy mock greeting removed in favor of useNovaChat.
    const today = new Date().toISOString().split('T')[0];
    const todayProgress = progress.find((p) => p.date === today);
    const pendingOpps = opportunities.filter((o) => o.status === 'Interview' || o.status === 'Applied');
    const upcomingDeadlines = opportunities
      .filter((o) => o.status !== 'Completed' && o.status !== 'Selected' && o.status !== 'Rejected')
      .map((o) => ({
        ...o,
        days: Math.ceil((new Date(o.deadline).getTime() - new Date().getTime()) / (1000 * 3600 * 24)),
      }))
      .filter((o) => o.days > 0 && o.days <= 10)
      .sort((a, b) => a.days - b.days);

    const currentUserName = localStorage.getItem('career_os_user_name') || 'Student';
    let greeting = `Hello ${currentUserName}! 🌟 I am **Nova Assistant**.\n\n`;

    if (upcomingDeadlines.length > 0) {
      greeting += `⚠️ **Important Deadline Alert:** You have a deadline for **${upcomingDeadlines[0].title}** at **${upcomingDeadlines[0].organization}** in **${upcomingDeadlines[0].days} days**!\n\n`;
    }

    if (todayProgress && todayProgress.codingHours > 0) {
      greeting += `💻 Great job logging **${todayProgress.codingHours} coding hours** today and solving **${todayProgress.dsaQuestions} DSA questions**.\n\n`;
    } else {
      greeting += `🎯 You haven't logged any coding hours today. Let's tackle a LeetCode problem or review a study module!\n\n`;
    }

    if (pendingOpps.length > 0) {
      greeting += `💼 You have **${pendingOpps.length} active applications** currently in review or interview stage. Keep up the momentum!`;
    } else {
      greeting += `🚀 Ready to search and add some new tech opportunities to your active pipeline?`;
    }

    setMessages([
      {
        id: 'init-msg',
        sender: 'ai',
        text: greeting,
        timestamp: new Date(),
      },
    ]);
  */

  useEffect(() => {
    if (isWorkspace) return;
    const handleOpen = () => setIsOpen(true);
    window.addEventListener('open-ai-assistant', handleOpen);
    return () => window.removeEventListener('open-ai-assistant', handleOpen);
  }, [isWorkspace]);

  /* Legacy mock request flow removed in favor of useNovaChat.
    if (!text.trim() || assistantState !== 'idle') return;

    // 1. Add User Message
    const userMsg: Message = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInputText('');

    // 2. Reading Data Animation Phase
    setAssistantState('reading');
    await new Promise((resolve) => setTimeout(resolve, 380));

    // 3. Thinking State Animation Phase
    setAssistantState('thinking');
    await new Promise((resolve) => setTimeout(resolve, 450));

    // 4. Streaming Response Phase
    setAssistantState('streaming');
    const aiMsgId = `ai-${Date.now()}`;

    // Add empty placeholder AI message
    setMessages((prev) => [
      ...prev,
      {
        id: aiMsgId,
        sender: 'ai',
        text: '',
        timestamp: new Date(),
        isStreaming: true,
      },
    ]);

    const currentUserName = localStorage.getItem('career_os_user_name') || 'Student';
    const context = { opportunities, progress, timeline, userName: currentUserName };

    // Stream characters
    for await (const chunk of AIService.streamResponse(text, context, 16)) {
      setMessages((prev) =>
        prev.map((msg) => (msg.id === aiMsgId ? { ...msg, text: chunk } : msg))
      );
    }

    // Mark streaming complete
    setMessages((prev) =>
      prev.map((msg) => (msg.id === aiMsgId ? { ...msg, isStreaming: false } : msg))
    );
    setAssistantState('idle');
  */

  // Close Nova assistant on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isWorkspace && e.key === 'Escape' && isHistoryOpen) { setIsHistoryOpen(false); return; }
      if (isWorkspace) return;
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isHistoryOpen, isOpen, isWorkspace]);

  const quickPrompts = [
    { label: '🎯 Today Priorities', query: 'What should I do today?' },
    { label: '⚠️ Check Deadlines', query: 'Show my deadlines' },
    { label: '📊 Coding Metrics', query: 'Check my progress' },
    { label: '💡 Interview Tips', query: 'Give me interview prep tips' },
  ];
  const showQuickPrompts = messages.length <= 1 && assistantState === 'idle';

  return (
    <>
      {/* Mini Floating Trigger */}
      {!isOpen && !isWorkspace && (
        <motion.button
          type="button"
          id="ai-assistant-trigger"
          onClick={() => setIsOpen(true)}
          aria-label="Open Rule-Based Assistant chat"
          aria-expanded={false}
          aria-haspopup="dialog"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{
            duration: 0.2,
            ease: 'easeOut',
          }}
          whileHover={{ scale: 1.04, y: -2 }}
          whileTap={{ scale: 0.97 }}
          className="fixed bottom-[calc(8.75rem+env(safe-area-inset-bottom))] md:bottom-24 right-4 md:right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full border border-indigo-400/80 bg-gradient-to-tr from-indigo-600 to-purple-600 text-white shadow-xl shadow-indigo-950/40 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
        >
          <div className="absolute inset-0 rounded-full bg-indigo-500/20 pointer-events-none" />
          <Bot className="h-6 w-6 text-white" aria-hidden="true" />
        </motion.button>
      )}

      {/* Expanded Nova Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            role={isWorkspace ? 'region' : 'dialog'}
            aria-modal={isWorkspace ? undefined : true}
            aria-labelledby="assistant-title"
            initial={{ opacity: 0, scale: 0.9, y: 40, x: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 40, x: 20 }}
            className={`${isWorkspace
              ? 'h-full min-h-[600px] w-full flex flex-col justify-between overflow-hidden'
              : 'fixed bottom-[calc(8.75rem+env(safe-area-inset-bottom))] md:bottom-24 right-2 sm:right-6 left-2 sm:left-auto w-auto sm:w-[410px] max-w-[calc(100vw-1rem)] h-[75vh] sm:h-[520px] max-h-[560px] flex flex-col justify-between rounded-3xl shadow-2xl z-50'
            } rounded-3xl border ${
              theme === 'dark'
                ? 'bg-slate-950/95 border-slate-800/80 text-slate-100 shadow-indigo-950/30'
                : 'bg-white/95 border-slate-200 text-slate-800 shadow-slate-300/50'
            } backdrop-blur-xl border-indigo-500/20`}
          >
            {/* Header with Title & Badge */}
            <div className="px-4 py-3 border-b border-slate-800/40 flex items-center justify-between bg-gradient-to-r from-indigo-950/40 via-purple-950/20 to-slate-950">
              <div className="flex items-center gap-2.5">
                <div className="relative h-9 w-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 flex items-center justify-center shadow-md border border-indigo-400/30">
                  <Bot className="h-5 w-5 text-white" aria-hidden="true" />
                  <div className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-slate-950 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 id="assistant-title" className="font-display font-bold text-sm tracking-tight text-slate-100">
                      {isWorkspace ? 'Nova planning conversation' : 'Nova Assistant'} <span className="text-[10px] text-indigo-400 font-mono font-semibold">(Beta)</span>
                    </h3>
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {/* Badge Requirement */}
                    <span className="text-[9px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                      Rule-Based Assistant
                    </span>
                    <span className="text-[10px] text-slate-400">• Context-Aware</span>
                  </div>
                </div>
              </div>
              {!isWorkspace && <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label="Close Assistant chat window"
                className={`p-1.5 rounded-xl hover:bg-slate-800/50 transition-all ${
                  theme === 'dark' ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-800'
                } cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500`}
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>}
              {isWorkspace && <button type="button" onClick={() => setIsHistoryOpen(true)} aria-label="Open conversation history" className="rounded-xl p-2 text-slate-400 hover:bg-slate-800/60 hover:text-white md:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"><Menu className="h-4 w-4" /></button>}
            </div>

            <AnimatePresence>
              {isWorkspace && isHistoryOpen && <>
                <motion.button type="button" aria-label="Close conversation history" onClick={() => setIsHistoryOpen(false)} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] bg-slate-950/65 backdrop-blur-sm md:hidden" />
                <motion.div initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }} transition={{ type: 'spring', stiffness: 360, damping: 34 }} className="fixed inset-y-0 left-0 z-[70] w-72 shadow-2xl md:hidden">
                  <ConversationSidebar theme={theme} conversations={conversations} activeConversationId={activeConversationId} onNewChat={() => { newChat(); setIsHistoryOpen(false); }} onSelect={(id) => { selectConversation(id); setIsHistoryOpen(false); }} onRename={renameConversation} onDelete={deleteConversation} onTogglePin={toggleConversationPin} mobile />
                </motion.div>
              </>}
            </AnimatePresence>

            <div className="flex min-h-0 flex-1">
              {isWorkspace && <ConversationSidebar theme={theme} conversations={conversations} activeConversationId={activeConversationId} onNewChat={newChat} onSelect={selectConversation} onRename={renameConversation} onDelete={deleteConversation} onTogglePin={toggleConversationPin} />}
              <div className="flex min-w-0 flex-1 flex-col">
            {/* Reading Data State Banner */}
            <AnimatePresence>
              {assistantState === 'reading' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  role="status"
                  aria-live="polite"
                  className="bg-indigo-950/40 border-b border-indigo-800/30 px-3.5 py-2 flex items-center gap-2 text-[11px] text-indigo-300 font-medium"
                >
                  <Database className="h-3.5 w-3.5 text-indigo-400 animate-pulse shrink-0" aria-hidden="true" />
                  <span className="truncate">Scanning active opportunities & daily progress logs...</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Messages Area */}
            <div className={`flex-1 overflow-y-auto p-4 space-y-4 ${messages.length === 1 && assistantState === 'idle' ? 'flex flex-col justify-center' : ''}`} role="log" aria-live="polite" aria-relevant="additions text">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-2.5 max-w-[88%] ${
                    msg.role === 'user' ? 'ml-auto flex-row-reverse' : ''
                  }`}
                >
                  <div
                    className={`h-7 w-7 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${
                      msg.role === 'user'
                        ? 'bg-indigo-600 text-white'
                        : theme === 'dark'
                        ? 'bg-slate-900 border border-slate-800 text-indigo-400'
                        : 'bg-indigo-50 text-indigo-600 border border-indigo-100'
                    }`}
                  >
                    {msg.role === 'user' ? <User className="h-3.5 w-3.5" aria-hidden="true" /> : <Bot className="h-3.5 w-3.5" aria-hidden="true" />}
                  </div>

                  <div className="space-y-1 min-w-0">
                    <div
                      className={`px-3.5 py-2.5 rounded-2xl ${
                        msg.role === 'user'
                          ? 'bg-indigo-600 text-white rounded-tr-none shadow-md'
                          : theme === 'dark'
                          ? 'bg-slate-900/80 border border-slate-800/80 text-slate-200 rounded-tl-none shadow-sm'
                          : 'bg-slate-50 text-slate-800 border border-slate-200/80 rounded-tl-none shadow-sm'
                      }`}
                    >
                      {/* Markdown Formatted Text */}
                      <MarkdownText content={msg.text} isStreaming={msg.isStreaming} />
                    </div>
                    <span className="text-[9px] text-slate-500 block text-right font-mono px-1">
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))}

              {/* Thinking Indicator Animation */}
              {assistantState === 'thinking' && (
                <div className="flex gap-2.5 max-w-[80%] items-start" role="status" aria-live="polite">
                  <div
                    className={`h-7 w-7 rounded-xl flex items-center justify-center shrink-0 ${
                      theme === 'dark' ? 'bg-slate-900 border border-slate-800 text-indigo-400' : 'bg-slate-100 text-indigo-600'
                    }`}
                  >
                    <Cpu className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                  </div>
                  <div
                    className={`px-3.5 py-2.5 rounded-2xl rounded-tl-none space-y-1.5 ${
                      theme === 'dark' ? 'bg-slate-900/80 border border-slate-800/80' : 'bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-indigo-400 font-medium">Nova is synthesizing response</span>
                      <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Suggested Prompts Section */}
            {showQuickPrompts && <div className="px-3 py-2 border-t border-slate-800/30 bg-slate-950/20 flex gap-1.5 overflow-x-auto shrink-0 scrollbar-none" role="group" aria-label="Suggested quick prompts">
              {quickPrompts.map((p, idx) => (
                <button
                  type="button"
                  key={idx}
                  disabled={assistantState !== 'idle'}
                  onClick={() => sendMessage(p.query)}
                  aria-label={p.label}
                  className={`px-2.5 py-1.5 rounded-xl border text-[10px] font-medium whitespace-nowrap transition-all flex items-center gap-1 shrink-0 ${
                    theme === 'dark'
                      ? 'bg-slate-900 border-slate-800/90 text-slate-300 hover:text-white hover:bg-slate-800/90 hover:border-indigo-500/40'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-100'
                  } disabled:opacity-50 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500`}
                >
                  <Zap className="h-3 w-3 text-amber-400 shrink-0" aria-hidden="true" />
                  {p.label}
                </button>
              ))}
            </div>}

            {/* Input Box */}
            <div className="p-3 border-t border-slate-800/30 bg-slate-950/30 shrink-0">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  sendMessage(inputText);
                }}
                className="flex items-center gap-2"
              >
                <label htmlFor="ai-chat-input" className="sr-only">
                  Ask Nova Assistant a question
                </label>
                <textarea
                  id="ai-chat-input"
                  placeholder="Ask Nova about your goals, tasks, or metrics..."
                  value={inputText}
                  disabled={assistantState !== 'idle'}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' && !event.shiftKey) {
                      event.preventDefault();
                      if (inputText.trim() && assistantState === 'idle') sendMessage(inputText);
                    }
                  }}
                  rows={1}
                  className={`flex-1 min-h-9 max-h-32 resize-y px-3.5 py-2 rounded-xl border text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none transition-all ${
                    theme === 'dark'
                      ? 'bg-slate-950/70 border-slate-800/90 text-slate-100 placeholder:text-slate-500'
                      : 'bg-slate-50 border-slate-200 text-slate-800 placeholder:text-slate-400'
                  } disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-indigo-500`}
                />
                <button
                  type="submit"
                  aria-label="Send message to Nova Assistant"
                  disabled={!inputText.trim() || assistantState !== 'idle'}
                  className="p-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md hover:from-indigo-500 hover:to-purple-500 transition-all disabled:opacity-40 cursor-pointer shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                >
                  <Send className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </form>
            </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
