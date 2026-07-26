import { Command, Search, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { Certificate, Note, Opportunity } from '../types';

interface GlobalSearchProps {
  open: boolean;
  onClose: () => void;
  onNavigate: (view: string) => void;
  opportunities: Opportunity[];
  notes: Note[];
  certificates: Certificate[];
}

const destinations = [
  ['Dashboard', 'dashboard'], ['Nova AI', 'nova'], ['Opportunities', 'opportunities'], ['Journey', 'journey'], ['Progress', 'progress'], ['Certificates', 'certificates'], ['Notes', 'notes'], ['Settings', 'settings'], ['Feedback', 'feedback'], ['Changelog', 'changelog'],
] as const;

export default function GlobalSearch({ open, onClose, onNavigate, opportunities, notes, certificates }: GlobalSearchProps) {
  const [query, setQuery] = useState('');
  useEffect(() => { if (!open) setQuery(''); }, [open]);
  const results = useMemo(() => {
    const term = query.trim().toLowerCase();
    const navigation = destinations.map(([label, view]) => ({ label, meta: 'Go to', view }));
    const records = [
      ...opportunities.map((item) => ({ label: item.title, meta: 'Opportunity', view: 'opportunities' })),
      ...notes.map((item) => ({ label: item.title, meta: 'Note', view: 'notes' })),
      ...certificates.map((item) => ({ label: item.name, meta: 'Certificate', view: 'certificates' })),
    ];
    return [...navigation, ...records].filter((item) => !term || `${item.label} ${item.meta}`.toLowerCase().includes(term)).slice(0, 8);
  }, [certificates, notes, opportunities, query]);
  const select = (view: string) => { onNavigate(view); onClose(); };
  return <AnimatePresence>{open && <motion.div className="fixed inset-0 z-[110] bg-slate-950/70 p-4 pt-[12vh] backdrop-blur-sm" onMouseDown={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><motion.section role="dialog" aria-modal="true" aria-label="Global search" className="mx-auto w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl" onMouseDown={(event) => event.stopPropagation()} initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}><div className="flex items-center gap-3 border-b border-slate-800 px-4"><Search className="h-5 w-5 text-slate-500" /><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search pages, opportunities, notes…" className="h-14 min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-slate-500" /><button type="button" onClick={onClose} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-800 hover:text-white"><X className="h-4 w-4" /></button></div><div className="max-h-[55vh] overflow-y-auto p-2">{results.length ? results.map((result) => <button key={`${result.meta}-${result.label}`} type="button" onClick={() => select(result.view)} className="flex w-full items-center justify-between rounded-xl px-3 py-3 text-left transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"><span className="text-sm font-medium text-slate-100">{result.label}</span><span className="text-xs text-slate-500">{result.meta}</span></button>) : <div className="px-4 py-10 text-center text-sm text-slate-500">No results. Try a page, opportunity, note, or certificate.</div>}</div><div className="flex items-center justify-between border-t border-slate-800 px-4 py-2.5 text-[11px] text-slate-500"><span>Navigate your workspace</span><span className="inline-flex items-center gap-1"><Command className="h-3 w-3" />K to open</span></div></motion.section></motion.div>}</AnimatePresence>;
}
