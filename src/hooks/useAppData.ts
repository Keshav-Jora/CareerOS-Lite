import { useState, useEffect, useCallback, useMemo } from 'react';
import { dataService } from '../services/dataService';
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

export function useAppData() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [timelineEntries, setTimelineEntries] = useState<TimelineEntry[]>([]);
  const [progressData, setProgressData] = useState<DailyProgress[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [activities, setActivities] = useState<ActivityLog[]>([]);

  // User Profile
  const [userName, setUserName] = useState('Student');
  const [userSchool, setUserSchool] = useState('Not Set');
  const [userGrad, setUserGrad] = useState('Not Set');

  const loadDatabase = useCallback(() => {
    dataService.initialize();
    const data = dataService.fetchAllData();

    setOpportunities(data.opportunities);
    setTimelineEntries(data.timelineEntries);
    setProgressData(data.progressData);
    setCertificates(data.certificates);
    setNotes(data.notes);
    setNotifications(data.notifications);
    setActivities(data.activities);
    setUserName(data.userName);
    setUserSchool(data.userSchool);
    setUserGrad(data.userGrad);
  }, []);

  useEffect(() => {
    loadDatabase();
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
    dataService.saveOpportunity(opp);
    const updated = dataService.fetchAllData();
    setOpportunities(updated.opportunities);
    setActivities(updated.activities);
    setNotifications(updated.notifications);
  }, []);

  const handleDeleteOpportunity = useCallback((id: string) => {
    dataService.deleteOpportunity(id);
    const updated = dataService.fetchAllData();
    setOpportunities(updated.opportunities);
    setActivities(updated.activities);
    setNotifications(updated.notifications);
  }, []);

  const handleSaveTimelineEntry = useCallback((entry: TimelineEntry) => {
    dataService.saveTimelineEntry(entry);
    const updated = dataService.fetchAllData();
    setTimelineEntries(updated.timelineEntries);
    setActivities(updated.activities);
  }, []);

  const handleDeleteTimelineEntry = useCallback((id: string) => {
    dataService.deleteTimelineEntry(id);
    const updated = dataService.fetchAllData();
    setTimelineEntries(updated.timelineEntries);
    setActivities(updated.activities);
  }, []);

  const handleUpdateDailyProgress = useCallback((progress: DailyProgress) => {
    dataService.updateDailyProgress(progress);
    const updated = dataService.fetchAllData();
    setProgressData(updated.progressData);
    setActivities(updated.activities);
  }, []);

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
    handleSaveCertificate,
    handleDeleteCertificate,
    handleSaveNote,
    handleDeleteNote,
    handleMarkNotificationRead,
    handleResetData,
    handleLoadSeedData,
  };
}
