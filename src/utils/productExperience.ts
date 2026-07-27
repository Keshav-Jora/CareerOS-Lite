const ONBOARDING_KEY = 'career_os_onboarding_complete';
export const isOnboardingComplete = () => localStorage.getItem(ONBOARDING_KEY) === 'true';
export const completeOnboarding = () => localStorage.setItem(ONBOARDING_KEY, 'true');
export const timeAgo = (value: string): string => { const time = new Date(value).getTime(); if (Number.isNaN(time)) return value; const minutes = Math.max(0, Math.floor((Date.now() - time) / 60_000)); return minutes < 1 ? 'Just now' : minutes < 60 ? `${minutes}m ago` : minutes < 1440 ? `${Math.floor(minutes / 60)}h ago` : `${Math.floor(minutes / 1440)}d ago`; };
