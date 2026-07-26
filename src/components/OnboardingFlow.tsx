import { CheckCircle2, Circle, Sparkles, X } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface OnboardingFlowProps {
  open: boolean;
  onComplete: () => void;
  onNavigate: (view: string) => void;
}

const steps = [
  { label: 'Personalize your profile', detail: 'Add your school and graduation details.', view: 'settings' },
  { label: 'Capture an opportunity', detail: 'Start a focused application pipeline.', view: 'opportunities' },
  { label: 'Meet Nova', detail: 'Ask for help with your next career decision.', view: 'nova' },
];

export default function OnboardingFlow({ open, onComplete, onNavigate }: OnboardingFlowProps) {
  const [completed, setCompleted] = useState<number[]>([]);
  const progress = Math.round((completed.length / steps.length) * 100);
  const visitStep = (index: number, view: string) => { setCompleted((current) => current.includes(index) ? current : [...current, index]); onNavigate(view); };
  return <AnimatePresence>{open && <motion.div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><motion.section role="dialog" aria-modal="true" aria-labelledby="onboarding-title" className="w-full max-w-xl rounded-3xl border border-slate-700 bg-slate-900 p-6 shadow-2xl" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 16 }}><div className="flex items-start justify-between"><div><div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-500/15 text-indigo-300"><Sparkles className="h-5 w-5" /></div><h2 id="onboarding-title" className="mt-4 font-display text-2xl font-bold text-white">Welcome to CareerOS</h2><p className="mt-1 text-sm text-slate-400">A few focused steps will make your workspace more useful.</p></div><button type="button" onClick={onComplete} aria-label="Skip onboarding" className="rounded-xl p-2 text-slate-400 hover:bg-slate-800 hover:text-white"><X className="h-5 w-5" /></button></div><div className="mt-6"><div className="mb-2 flex items-center justify-between text-xs font-medium text-slate-400"><span>Setup progress</span><span>{progress}%</span></div><div className="h-2 overflow-hidden rounded-full bg-slate-800"><div className="h-full rounded-full bg-indigo-400 transition-all" style={{ width: `${progress}%` }} /></div></div><div className="mt-5 space-y-2">{steps.map((step, index) => { const isDone = completed.includes(index); return <button key={step.label} type="button" onClick={() => visitStep(index, step.view)} className="flex w-full items-center gap-3 rounded-2xl border border-slate-800 p-4 text-left transition hover:border-indigo-500/50 hover:bg-slate-800/60"><span className={isDone ? 'text-emerald-400' : 'text-slate-500'}>{isDone ? <CheckCircle2 className="h-5 w-5" /> : <Circle className="h-5 w-5" />}</span><span><span className="block text-sm font-semibold text-white">{step.label}</span><span className="mt-0.5 block text-xs text-slate-400">{step.detail}</span></span></button>; })}</div><button type="button" onClick={onComplete} className="mt-6 w-full rounded-xl bg-indigo-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-400">{completed.length === steps.length ? 'Finish setup' : 'I’ll do this later'}</button></motion.section></motion.div>}</AnimatePresence>;
}
