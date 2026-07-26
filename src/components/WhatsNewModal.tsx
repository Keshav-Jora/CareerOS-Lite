import { CheckCircle2, Sparkles, Wrench, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PRODUCT_VERSION } from '../utils/productExperience';

interface WhatsNewModalProps {
  open: boolean;
  onClose: () => void;
}

const updates = [
  { label: 'New', icon: Sparkles, items: ['Notification center with read status', 'Global search and Ctrl+K command palette', 'First-time onboarding checklist'] },
  { label: 'Improved', icon: CheckCircle2, items: ['Faster dashboard actions', 'Profile completion guidance'] },
  { label: 'Fixed', icon: Wrench, items: ['Clearer empty states across your workspace'] },
];

export default function WhatsNewModal({ open, onClose }: WhatsNewModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <motion.section role="dialog" aria-modal="true" aria-labelledby="whats-new-title" className="w-full max-w-lg rounded-3xl border border-slate-700 bg-slate-900 p-6 shadow-2xl" initial={{ opacity: 0, y: 16, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 16, scale: 0.98 }}>
            <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-widest text-indigo-300">CareerOS Lite · {PRODUCT_VERSION}</p><h2 id="whats-new-title" className="mt-2 font-display text-2xl font-bold text-white">What’s new</h2></div><button type="button" onClick={onClose} aria-label="Close what’s new" className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-800 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"><X className="h-5 w-5" /></button></div>
            <div className="mt-6 space-y-5">{updates.map(({ label, icon: Icon, items }) => <div key={label}><div className="flex items-center gap-2 text-sm font-semibold text-white"><Icon className="h-4 w-4 text-indigo-300" />{label}</div><ul className="mt-2 space-y-1.5 pl-6 text-sm text-slate-400">{items.map((item) => <li key={item} className="list-disc">{item}</li>)}</ul></div>)}</div>
            <button type="button" onClick={onClose} className="mt-7 w-full rounded-xl bg-indigo-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300">Explore CareerOS</button>
          </motion.section>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
