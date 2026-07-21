import { useState, useEffect, useCallback, useMemo } from 'react';
import { dataService } from '../services/dataService';
import type { CanonicalCareerData, CareerMission } from '../types/career-data';
import { calculateGamification, GamificationStats } from '../utils/gamification';
import {
  Opportunity,
  TimelineEntry,
  DailyProgress,
  Certificate,
  Note,
  AppNotification,
  ActivityLog,
} from '../types';
import { logOpportunityDebug } from '../utils/opportunityDebug';

export function useAppData() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [timelineEntries, setTimelineEntries] = useState<TimelineEntry[]>([]);
  const [progressData, setProgressData] = useState<DailyProgress[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [canonicalData, setCanonicalData] = useState<CanonicalCareerData | null>(null);

  // User Profile
  const [userName, setUserName] = useState('Student');
  const [userSchool, setUserSchool] = useState('Not Set');
  const [userGrad, setUserGrad] = useState('Not Set');

  const loadDatabase = useCallback(() => {
    dataService.initialize();
    const data = dataService.fetchAllData();
    const canonical = dataService.repository.getSnapshot();

    setOpportunities(data.opportunities);
    logOpportunityDebug('useAppData', 'src/hooks/useAppData.ts', 'loadDatabase', 'dataService.fetchAllData()', data.opportunities);
    setTimelineEntries(data.timelineEntries);
    setProgressData(data.progressData);
    setCertificates(data.certificates);
    setNotes(data.notes);
    setNotifications(data.notifications);
    setActivities(data.activities);
    setCanonicalData(canonical);
    setUserName(data.userName);
    setUserSchool(data.userSchool);
    setUserGrad(data.userGrad);
  }, []);

  useEffect(() => {
    loadDatabase();
  }, [loadDatabase]);

  useEffect(() => {
    window.addEventListener('career-os-data-changed', loadDatabase);
    return () => window.removeEventListener('career-os-data-changed', loadDatabase);
  }, [loadDatabase]);

  // Gamification stats memoized to prevent re-computations on unrelated state updates
  const gamification: GamificationStats = useMemo(
    () =>
      calculateGamification(
        opportunities,
        timelineEntries,
        certificates,
        notes,
        progressData
      ),
    [opportunities, timelineEntries, certificates, notes, progressData]
  );

  // Data Mutators - wrapped in useCallback for stable function references
  const handleSaveOpportunity = useCallback((opp: Opportunity) => {
    dataService.saveOpportunity(opp); loadDatabase();
  }, [loadDatabase]);

  const handleDeleteOpportunity = useCallback((id: string) => {
    dataService.deleteOpportunity(id); loadDatabase();
  }, [loadDatabase]);

  const handleSaveTimelineEntry = useCallback((entry: TimelineEntry) => {
    dataService.saveTimelineEntry(entry); loadDatabase();
  }, [loadDatabase]);

  const handleDeleteTimelineEntry = useCallback((id: string) => {
    dataService.deleteTimelineEntry(id); loadDatabase();
  }, [loadDatabase]);

  const handleUpdateDailyProgress = useCallback((progress: DailyProgress) => {
    dataService.updateDailyProgress(progress); loadDatabase();
  }, [loadDatabase]);

  const handleSaveMission = useCallback((mission: CareerMission) => {
    const existing = dataService.repository.get('mission', mission.id);
    if (existing) dataService.repository.update('mission', mission.id, mission);
    else dataService.repository.create('mission', mission);
    loadDatabase();
  }, [loadDatabase]);

  const handleDeleteMission = useCallback((id: string) => {
    dataService.repository.delete('mission', id);
    loadDatabase();
  }, [loadDatabase]);

  const handleSaveCertificate = useCallback((cert: Certificate) => {
    dataService.saveCertificate(cert);
    const updated = dataService.fetchAllData();
    setCertificates(updated.certificates);
    setTimelineEntries(updated.timelineEntries);
    setActivities(updated.activities);
  }, []);

  const handleDeleteCertificate = useCallback((id: string) => {
    dataService.deleteCertificate(id);
    const updated = dataService.fetchAllData();
    setCertificates(updated.certificates);
    setActivities(updated.activities);
  }, []);

  const handleSaveNote = useCallback((note: Note) => {
    dataService.saveNote(note);
    const updated = dataService.fetchAllData();
    setNotes(updated.notes);
    setActivities(updated.activities);
  }, []);

  const handleDeleteNote = useCallback((id: string) => {
    dataService.deleteNote(id);
    const updated = dataService.fetchAllData();
    setNotes(updated.notes);
    setActivities(updated.activities);
  }, []);

  const handleMarkNotificationRead = useCallback((id: string) => {
    dataService.markNotificationRead(id);
    const updated = dataService.fetchAllData();
    setNotifications(updated.notifications);
  }, []);

  const handleResetData = useCallback(() => {
    dataService.resetData();
    loadDatabase();
  }, [loadDatabase]);

  const handleLoadSeedData = useCallback(() => {
    dataService.loadSeedData();
    loadDatabase();
  }, [loadDatabase]);

  return {
    // Database State
    opportunities,
    timelineEntries,
    progressData,
    certificates,
    notes,
    notifications,
    activities,
    canonicalData,

    // Profile State
    userName,
    userSchool,
    userGrad,

    // Gamification
    gamification,

    // Actions
    loadDatabase,
    handleSaveOpportunity,
    handleDeleteOpportunity,
    handleSaveTimelineEntry,
    handleDeleteTimelineEntry,
    handleUpdateDailyProgress,
    handleSaveMission,
    handleDeleteMission,
    handleSaveCertificate,
    handleDeleteCertificate,
    handleSaveNote,
    handleDeleteNote,
    handleMarkNotificationRead,
    handleResetData,
    handleLoadSeedData,
  };
}
