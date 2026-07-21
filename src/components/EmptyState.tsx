import type { LucideIcon } from 'lucide-react';
import { ArrowRight } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  theme: 'light' | 'dark';
  actionLabel?: string;
  onAction?: () => void;
}

/** A shared, presentational empty state for data-driven CareerOS views. */
export default function EmptyState({
  icon: Icon,
  title,
  description,
  theme,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  const isDark = theme === 'dark';

  return (
    <div className={`rounded-2xl border border-dashed px-6 py-10 text-center ${isDark ? 'border-slate-700 bg-slate-950/30' : 'border-slate-300 bg-slate-50'}`}>
      <span className={`mx-auto flex h-12 w-12 items-center justify-center rounded-2xl ${isDark ? 'bg-slate-800/70 text-indigo-300' : 'bg-indigo-50 text-indigo-600'}`}>
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <h3 className={`mt-4 text-sm font-semibold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{title}</h3>
      <p className={`mx-auto mt-2 max-w-md text-sm leading-6 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{description}</p>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-indigo-500 px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-indigo-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
        >
          {actionLabel}
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
