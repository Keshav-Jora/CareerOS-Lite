import React, { useState, useEffect, useRef, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, X, Send, Bot, User, Zap, Database, Cpu } from 'lucide-react';
import { Opportunity, DailyProgress, TimelineEntry } from '../types';
import { AIService } from '../services/aiService';

interface AIAssistantProps {
  theme: 'light' | 'dark';
  opportunities: Opportunity[];
  progress: DailyProgress[];
  timeline: TimelineEntry[];
}

interface Message {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  timestamp: Date;
  isStreaming?: boolean;
}

type AssistantState = 'idle' | 'reading' | 'thinking' | 'streaming';

/**
 * Custom Markdown Content Renderer
 * Formats Markdown headers, lists, bold text, inline code, and quotes.
 */
const MarkdownText = React.memo(function MarkdownText({ content, isStreaming }: { content: string; isStreaming?: boolean }) {
  const lines = content.split('\n');

  return (
    <div className="space-y-1.5 text-xs leading-relaxed font-sans">
      {lines.map((line, idx) => {
        if (!line.trim()) {
          return <div key={idx} className="h-1" />;
        }

        // Header 3 or 2
        if (line.startsWith('### ') || line.startsWith('## ')) {
          const title = line.replace(/^###?\s*/, '');
          return (
            <h4 key={idx} className="font-display font-bold text-xs text-indigo-400 mt-1.5 mb-1 flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-indigo-400" />
              {parseInlineMarkdown(title)}
            </h4>
          );
        }

        // Bullet point
        if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
          const bulletContent = line.trim().replace(/^[-*]\s*/, '');
          return (
            <div key={idx} className="flex items-start gap-2 pl-1 my-0.5">
              <span className="text-indigo-400 font-bold shrink-0 mt-0.5">•</span>
              <span className="flex-1">{parseInlineMarkdown(bulletContent)}</span>
            </div>
          );
        }

        // Numbered list
        if (/^\d+\.\s/.test(line.trim())) {
          const numMatch = line.trim().match(/^(\d+)\.\s*(.*)/);
          if (numMatch) {
            return (
              <div key={idx} className="flex items-start gap-2 pl-1 my-0.5">
                <span className="text-indigo-400 font-mono font-bold shrink-0 text-[11px]">{numMatch[1]}.</span>
                <span className="flex-1">{parseInlineMarkdown(numMatch[2])}</span>
              </div>
            );
          }
        }

        // Blockquote
        if (line.trim().startsWith('> ')) {
          const quoteText = line.trim().replace(/^>\s*/, '');
          return (
            <div key={idx} className="pl-2.5 py-1 my-1 border-l-2 border-indigo-500/60 bg-indigo-500/5 rounded-r-lg italic text-[11px] text-slate-300">
              {parseInlineMarkdown(quoteText)}
            </div>
          );
        }

        // Standard Paragraph
        return <p key={idx}>{parseInlineMarkdown(line)}</p>;
      })}

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

export default function AIAssistant({ theme, opportunities, progress, timeline }: AIAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [assistantState, setAssistantState] = useState<AssistantState>('idle');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, assistantState]);

  // Initial Contextual Greeting on mount
  useEffect(() => {
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
  }, [opportunities, progress]);

  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    window.addEventListener('open-ai-assistant', handleOpen);
    return () => window.removeEventListener('open-ai-assistant', handleOpen);
  }, []);

  // Handle Send Message
  const handleSendMessage = async (text: string) => {
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
  };

  // Close Nova assistant on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const quickPrompts = [
    { label: '🎯 Today Priorities', query: 'What should I do today?' },
    { label: '⚠️ Check Deadlines', query: 'Show my deadlines' },
    { label: '📊 Coding Metrics', query: 'Check my progress' },
    { label: '💡 Interview Tips', query: 'Give me interview prep tips' },
  ];

  return (
    <>
      {/* Mini Floating Trigger */}
      {!isOpen && (
        <motion.button
          type="button"
          id="ai-assistant-trigger"
          onClick={() => setIsOpen(true)}
          aria-label="Open Rule-Based Assistant chat"
          aria-expanded={false}
          aria-haspopup="dialog"
          initial={{ scale: 0, opacity: 0 }}
          animate={{
            scale: [1, 1.05, 1],
            opacity: 1,
            boxShadow: [
              '0 0 15px rgba(99, 102, 241, 0.4)',
              '0 0 25px rgba(99, 102, 241, 0.8)',
              '0 0 15px rgba(99, 102, 241, 0.4)',
            ],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 text-white border border-indigo-400 shadow-2xl cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
        >
          <div className="absolute inset-0 rounded-full bg-indigo-500/20 animate-ping pointer-events-none" />
          <Bot className="h-6 w-6 text-white" aria-hidden="true" />
        </motion.button>
      )}

      {/* Expanded Nova Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="assistant-title"
            initial={{ opacity: 0, scale: 0.9, y: 40, x: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 40, x: 20 }}
            className={`fixed bottom-20 md:bottom-6 right-2 sm:right-6 left-2 sm:left-auto w-auto sm:w-[410px] max-w-[calc(100vw-1rem)] h-[75vh] sm:h-[520px] max-h-[560px] flex flex-col justify-between rounded-3xl border shadow-2xl overflow-hidden z-50 ${
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
                      Nova Assistant <span className="text-[10px] text-indigo-400 font-mono font-semibold">(Beta)</span>
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
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label="Close Assistant chat window"
                className={`p-1.5 rounded-xl hover:bg-slate-800/50 transition-all ${
                  theme === 'dark' ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-800'
                } cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500`}
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

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
            <div className="flex-1 overflow-y-auto p-4 space-y-4" role="log" aria-live="polite" aria-relevant="additions text">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-2.5 max-w-[88%] ${
                    msg.sender === 'user' ? 'ml-auto flex-row-reverse' : ''
                  }`}
                >
                  <div
                    className={`h-7 w-7 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${
                      msg.sender === 'user'
                        ? 'bg-indigo-600 text-white'
                        : theme === 'dark'
                        ? 'bg-slate-900 border border-slate-800 text-indigo-400'
                        : 'bg-indigo-50 text-indigo-600 border border-indigo-100'
                    }`}
                  >
                    {msg.sender === 'user' ? <User className="h-3.5 w-3.5" aria-hidden="true" /> : <Bot className="h-3.5 w-3.5" aria-hidden="true" />}
                  </div>

                  <div className="space-y-1 min-w-0">
                    <div
                      className={`px-3.5 py-2.5 rounded-2xl ${
                        msg.sender === 'user'
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
            <div className="px-3 py-2 border-t border-slate-800/30 bg-slate-950/20 flex gap-1.5 overflow-x-auto shrink-0 scrollbar-none" role="group" aria-label="Suggested quick prompts">
              {quickPrompts.map((p, idx) => (
                <button
                  type="button"
                  key={idx}
                  disabled={assistantState !== 'idle'}
                  onClick={() => handleSendMessage(p.query)}
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
            </div>

            {/* Input Box */}
            <div className="p-3 border-t border-slate-800/30 bg-slate-950/30 shrink-0">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage(inputText);
                }}
                className="flex items-center gap-2"
              >
                <label htmlFor="ai-chat-input" className="sr-only">
                  Ask Nova Assistant a question
                </label>
                <input
                  id="ai-chat-input"
                  type="text"
                  placeholder="Ask Nova about your goals, tasks, or metrics..."
                  value={inputText}
                  disabled={assistantState !== 'idle'}
                  onChange={(e) => setInputText(e.target.value)}
                  className={`flex-1 px-3.5 py-2 rounded-xl border text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none transition-all ${
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
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
