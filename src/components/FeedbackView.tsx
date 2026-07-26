import { useState, type FormEvent } from 'react';
import type { User } from 'firebase/auth';
import { CheckCircle2, ImagePlus, Star } from 'lucide-react';
import { FeedbackRepository } from '../feedback/FeedbackRepository';
import type { FeedbackKind } from '../feedback/FeedbackTypes';

const repository = new FeedbackRepository();
const kinds: Array<{ value: FeedbackKind; label: string }> = [{ value: 'general', label: 'General feedback' }, { value: 'bug', label: 'Bug report' }, { value: 'feature', label: 'Feature request' }];

export default function FeedbackView({ theme, user }: { theme: 'light' | 'dark'; user: User | null }) {
  const [rating, setRating] = useState(0);
  const [kind, setKind] = useState<FeedbackKind>('general');
  const [message, setMessage] = useState('');
  const [screenshot, setScreenshot] = useState<File | undefined>();
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const isDark = theme === 'dark';
  const submit = async (event: FormEvent) => {
    event.preventDefault(); setError(null);
    if (!user) { setError('Sign in to submit feedback.'); return; }
    if (!rating) { setError('Select a rating from 1 to 5 stars.'); return; }
    if (!message.trim()) { setError('Tell us what you think before submitting.'); return; }
    setStatus('sending');
    try { await repository.submit(user, { rating, kind, message, screenshot }); setStatus('success'); setMessage(''); setRating(0); setScreenshot(undefined); }
    catch (reason) { setStatus('error'); setError(reason instanceof Error ? reason.message : 'Feedback could not be submitted.'); }
  };
  return <section className="mx-auto w-full max-w-3xl"><div className={`rounded-2xl border p-6 sm:p-8 ${isDark ? 'border-slate-800 bg-slate-900/70 text-slate-100' : 'border-slate-200 bg-white text-slate-900'}`}><h1 className="text-2xl font-semibold tracking-tight">Share feedback</h1><p className={`mt-2 text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Help shape CareerOS Lite. Feedback is reviewed by the product owner.</p>{status === 'success' ? <div role="status" className="mt-8 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-5 text-emerald-200"><CheckCircle2 className="mr-2 inline h-5 w-5" />Thank you — your feedback was submitted successfully.<button type="button" onClick={() => setStatus('idle')} className="ml-3 text-sm font-semibold underline">Submit another</button></div> : <form className="mt-8 space-y-6" onSubmit={submit}><fieldset><legend className="text-sm font-medium">Rating <span className="text-rose-400">*</span></legend><div className="mt-2 flex gap-1" aria-label="Rating">{[1, 2, 3, 4, 5].map((value) => <button key={value} type="button" onClick={() => setRating(value)} aria-label={`${value} star${value > 1 ? 's' : ''}`} aria-pressed={rating === value} className="rounded p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"><Star className={`h-7 w-7 ${value <= rating ? 'fill-amber-400 text-amber-400' : isDark ? 'text-slate-600' : 'text-slate-300'}`} /></button>)}</div></fieldset><label className="block text-sm font-medium">Feedback type<select value={kind} onChange={(event) => setKind(event.target.value as FeedbackKind)} className={`mt-2 h-11 w-full rounded-xl border px-3 outline-none focus:ring-2 focus:ring-indigo-400 ${isDark ? 'border-slate-700 bg-slate-950 text-slate-100' : 'border-slate-300 bg-white text-slate-900'}`}>{kinds.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label><label className="block text-sm font-medium">Your feedback <span className="text-rose-400">*</span><textarea value={message} onChange={(event) => setMessage(event.target.value)} rows={6} maxLength={4000} placeholder="What is working well, what is not, or what would help most?" className={`mt-2 w-full resize-y rounded-xl border p-3 outline-none focus:ring-2 focus:ring-indigo-400 ${isDark ? 'border-slate-700 bg-slate-950 text-slate-100 placeholder:text-slate-600' : 'border-slate-300 bg-white text-slate-900 placeholder:text-slate-400'}`} /></label><label className={`flex cursor-pointer items-center gap-2 rounded-xl border border-dashed p-3 text-sm ${isDark ? 'border-slate-700 text-slate-400' : 'border-slate-300 text-slate-600'}`}><ImagePlus className="h-4 w-4" /><span>{screenshot ? screenshot.name : 'Attach an optional screenshot (image, max 5 MB)'}</span><input type="file" accept="image/*" className="sr-only" onChange={(event) => { const file = event.target.files?.[0]; if (file && file.size > 5 * 1024 * 1024) { setError('Screenshots must be 5 MB or smaller.'); return; } setScreenshot(file); }} /></label>{error && <p role="alert" className="text-sm text-rose-400">{error}</p>}<button type="submit" disabled={status === 'sending'} className="h-11 rounded-xl bg-indigo-600 px-5 text-sm font-semibold text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60">{status === 'sending' ? 'Submitting…' : 'Submit feedback'}</button></form>}</div></section>;
}
