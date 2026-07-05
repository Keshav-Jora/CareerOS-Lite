import { Opportunity, TimelineEntry, Certificate, Note, DailyProgress } from '../types';

export interface GamificationStats {
  totalXP: number;
  level: number;
  xpForCurrentLevel: number;
  xpProgress: number;
  streak: number;
  careerHealthScore: number;
  consistencyScore: number;
  focusScore: number;
}

/**
 * Calculates XP, user level, progress to next level, active streak days, and dynamic career scores.
 */
export function calculateGamification(
  opportunities: Opportunity[],
  timelineEntries: TimelineEntry[],
  certificates: Certificate[],
  notes: Note[],
  progressData: DailyProgress[]
): GamificationStats {
  // 1. Certificate: +50 XP
  const certXP = certificates.length * 50;

  // 2. Opportunity Applied: +20 XP, Hackathon Applied: +25 XP
  const oppXP = opportunities.reduce((acc, opp) => {
    if (opp.category === 'Hackathon') {
      return acc + 25;
    }
    if (['Applied', 'Under Review', 'Shortlisted', 'Interview', 'Selected', 'Completed'].includes(opp.status)) {
      return acc + 20;
    }
    return acc + 5; // Saved / Planned
  }, 0);

  // 3. Journey Entry: +5 XP
  const journeyXP = timelineEntries.length * 5;

  // 4. Daily Study Session: +10 XP per active session
  const studySessionsCount = progressData.filter(
    (p) => p.codingHours > 0 || p.projectsHours > 0 || p.readingMinutes > 0
  ).length;
  const studyXP = studySessionsCount * 10;

  // 5. DSA Question: +5 XP per solved question
  const totalDSAQuestions = progressData.reduce((acc, curr) => acc + (curr.dsaQuestions || 0), 0);
  const dsaXP = totalDSAQuestions * 5;

  const totalXP = certXP + oppXP + journeyXP + studyXP + dsaXP;

  // Level Calculation: 100 XP per level
  const xpPerLevel = 100;
  const level = Math.floor(totalXP / xpPerLevel) + 1;
  const xpForCurrentLevel = totalXP % xpPerLevel;
  const xpProgress = (xpForCurrentLevel / xpPerLevel) * 100;

  // Streak calculation
  const streak = calculateStreak(progressData, timelineEntries, opportunities, certificates);

  // Dynamic Scores
  const careerHealthScore = calculateCareerHealthScore(opportunities, certificates, timelineEntries, streak);
  const consistencyScore = calculateConsistencyScore(progressData, streak);
  const focusScore = calculateFocusScore(progressData);

  return {
    totalXP,
    level,
    xpForCurrentLevel,
    xpProgress,
    streak,
    careerHealthScore,
    consistencyScore,
    focusScore,
  };
}

function calculateStreak(
  progressData: DailyProgress[],
  timelineEntries: TimelineEntry[],
  opportunities: Opportunity[],
  certificates: Certificate[]
): number {
  const activeDatesSet = new Set<string>();

  // Collect active dates from all user activities
  progressData.forEach((p) => {
    if (p.codingHours > 0 || p.dsaQuestions > 0 || p.projectsHours > 0 || p.readingMinutes > 0) {
      if (p.date) activeDatesSet.add(p.date);
    }
  });

  timelineEntries.forEach((t) => {
    if (t.date) activeDatesSet.add(t.date);
  });

  opportunities.forEach((o) => {
    if (o.applyDate) activeDatesSet.add(o.applyDate);
  });

  certificates.forEach((c) => {
    if (c.date) activeDatesSet.add(c.date);
  });

  if (activeDatesSet.size === 0) return 0;

  const sortedDates = Array.from(activeDatesSet).sort(
    (a, b) => new Date(b + 'T00:00:00').getTime() - new Date(a + 'T00:00:00').getTime()
  );

  const todayStr = new Date().toISOString().split('T')[0];
  const todayTime = new Date(todayStr + 'T00:00:00').getTime();
  const oneDayMs = 24 * 60 * 60 * 1000;

  const latestActivityTime = new Date(sortedDates[0] + 'T00:00:00').getTime();
  const diffFromToday = todayTime - latestActivityTime;

  // If last activity is older than 1 day (i.e. older than yesterday), streak is broken
  if (diffFromToday > oneDayMs) {
    return 0;
  }

  let streak = 1;
  let lastCheckedTime = latestActivityTime;

  for (let i = 1; i < sortedDates.length; i++) {
    const currentActivityTime = new Date(sortedDates[i] + 'T00:00:00').getTime();
    const diff = lastCheckedTime - currentActivityTime;

    if (diff === oneDayMs) {
      streak++;
      lastCheckedTime = currentActivityTime;
    } else if (diff > oneDayMs) {
      break;
    }
  }

  return streak;
}

function calculateCareerHealthScore(
  opportunities: Opportunity[],
  certificates: Certificate[],
  timelineEntries: TimelineEntry[],
  streak: number
): number {
  if (opportunities.length === 0 && certificates.length === 0 && timelineEntries.length === 0) {
    return 0;
  }

  const activeOpps = opportunities.filter(
    (o) => o.status === 'Applied' || o.status === 'Under Review' || o.status === 'Shortlisted' || o.status === 'Interview'
  ).length;

  const oppScore = Math.min(activeOpps * 15, 45);
  const certScore = Math.min(certificates.length * 15, 30);
  const journeyScore = Math.min(timelineEntries.length * 5, 15);
  const streakScore = Math.min(streak * 2, 10);

  return Math.min(100, oppScore + certScore + journeyScore + streakScore);
}

function calculateConsistencyScore(progressData: DailyProgress[], streak: number): number {
  if (progressData.length === 0) return 0;

  const todayStr = new Date().toISOString().split('T')[0];
  const today = new Date(todayStr + 'T00:00:00');
  const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

  const activeDaysLast7 = progressData.filter((p) => {
    const d = new Date(p.date + 'T00:00:00');
    return d >= sevenDaysAgo && (p.codingHours > 0 || p.dsaQuestions > 0);
  }).length;

  const weeklyConsistency = Math.round((activeDaysLast7 / 7) * 60);
  const streakBonus = Math.min(streak * 8, 40);

  return Math.min(100, weeklyConsistency + streakBonus);
}

function calculateFocusScore(progressData: DailyProgress[]): number {
  if (progressData.length === 0) return 0;

  const todayStr = new Date().toISOString().split('T')[0];
  const today = new Date(todayStr + 'T00:00:00');
  const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

  const recent = progressData.filter((p) => new Date(p.date + 'T00:00:00') >= sevenDaysAgo);

  const recentHours = recent.reduce((acc, curr) => acc + (curr.codingHours || 0), 0);
  const recentDSA = recent.reduce((acc, curr) => acc + (curr.dsaQuestions || 0), 0);

  const hoursScore = Math.min(recentHours * 8, 50);
  const dsaScore = Math.min(recentDSA * 10, 50);

  return Math.min(100, Math.round(hoursScore + dsaScore));
}
