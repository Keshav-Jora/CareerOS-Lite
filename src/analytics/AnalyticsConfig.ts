/** Client-side analytics is opt-in and can be disabled without changing application code. */
export const AnalyticsConfig = {
  get enabled(): boolean {
    const value = import.meta.env.ENABLE_ANALYTICS ?? import.meta.env.VITE_ENABLE_ANALYTICS;
    return value?.trim().toLowerCase() === 'true';
  },
  get isDevelopment(): boolean {
    return import.meta.env.DEV;
  },
};
