const ONBOARDING_KEY = 'career_os_onboarding_complete';
const CHANGELOG_KEY = 'career_os_whats_new_version';
export const PRODUCT_VERSION = '0.2.0';
export const isOnboardingComplete = () => localStorage.getItem(ONBOARDING_KEY) === 'true';
export const completeOnboarding = () => localStorage.setItem(ONBOARDING_KEY, 'true');
export const shouldShowWhatsNew = () => localStorage.getItem(CHANGELOG_KEY) !== PRODUCT_VERSION;
export const dismissWhatsNew = () => localStorage.setItem(CHANGELOG_KEY, PRODUCT_VERSION);
export const timeAgo = (value: string): string => { const time = new Date(value).getTime(); if (Number.isNaN(time)) return value; const minutes = Math.max(0, Math.floor((Date.now() - time) / 60_000)); return minutes < 1 ? 'Just now' : minutes < 60 ? `${minutes}m ago` : minutes < 1440 ? `${Math.floor(minutes / 60)}h ago` : `${Math.floor(minutes / 1440)}d ago`; };
