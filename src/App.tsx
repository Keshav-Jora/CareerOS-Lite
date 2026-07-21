import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { User } from 'firebase/auth';
import { motion, AnimatePresence } from 'motion/react';

// Hooks & Services Architecture
import { useTheme } from './hooks/useTheme';
import { useAppData } from './hooks/useAppData';
import { CloudSyncService } from './services/cloud/CloudSyncService';
import { SessionManager } from './services/auth/SessionManager';
import { AuthService } from './services/auth/AuthService';
import { dataService } from './services/dataService';
import { setCareerDataUpdatedAt } from './utils/storage';
import { AnalyticsService } from './analytics/AnalyticsService';

// Component Imports
import Sidebar from './components/Sidebar';
import MobileNavigation from './components/MobileNavigation';
import QuickAddModal from './components/QuickAddModal';
import AIAssistant from './components/AIAssistant';
import DashboardView from './components/DashboardView';
import NovaWorkspace from './components/NovaWorkspace';
import OpportunitiesView from './components/OpportunitiesView';
import UpcomingView from './components/UpcomingView';
import JourneyView from './components/JourneyView';
import ProgressView from './components/ProgressView';
import CertificatesView from './components/CertificatesView';
import NotesView from './components/NotesView';
import SettingsView from './components/SettingsView';

export default function App() {
  // Navigation View State
  const [currentView, setCurrentView] = useState('dashboard');
  const [sessionUser, setSessionUser] = useState<User | null>(null);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'offline'>('offline');
  const [authBusy, setAuthBusy] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const cloudSync = useMemo(() => new CloudSyncService(), []);
  const isClearingAccount = useRef(false);

  // Modular Theme & Data Hooks
  const { theme, toggleTheme } = useTheme();
  const {
    opportunities,
    timelineEntries,
    progressData,
    certificates,
    notes,
    notifications,
    activities,
    canonicalData,
    userName,
    userSchool,
    userGrad,
    gamification,
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
  } = useAppData();

  const { totalXP, level, xpForCurrentLevel, xpProgress, streak } = gamification;

  useEffect(() => {
    AnalyticsService.track({ event: 'app_open', feature: 'application' });
    const trackAppError = () => AnalyticsService.track({ event: 'app_error', feature: 'application', metadata: { source: 'window' } });
    window.addEventListener('error', trackAppError);
    window.addEventListener('unhandledrejection', trackAppError);
    return () => {
      window.removeEventListener('error', trackAppError);
      window.removeEventListener('unhandledrejection', trackAppError);
    };
  }, []);

  useEffect(() => {
    const eventByView: Record<string, 'dashboard_opened' | 'settings_opened'> = { dashboard: 'dashboard_opened', settings: 'settings_opened' };
    const event = eventByView[currentView];
    if (event) AnalyticsService.track({ event, feature: currentView });
  }, [currentView]);

  const syncAccount = useCallback(async (user: User) => { setSyncStatus(navigator.onLine ? 'syncing' : 'offline'); try { await cloudSync.sync(user.uid); setSyncStatus(navigator.onLine ? 'synced' : 'offline'); } catch (error) { console.error('CareerOS cloud sync failed.', error); AnalyticsService.track({ event: 'firebase_error', feature: 'cloud_sync' }); setSyncStatus('offline'); } }, [cloudSync]);
  useEffect(() => new SessionManager().observe((user) => {
    setSessionUser(user);
    if (user) void syncAccount(user).finally(loadDatabase); else setSyncStatus('offline');
  }), [loadDatabase, syncAccount]);

  useEffect(() => {
    const flushQueue = () => { if (sessionUser) void syncAccount(sessionUser); };
    window.addEventListener('online', flushQueue);
    return () => window.removeEventListener('online', flushQueue);
  }, [sessionUser, syncAccount]);
  useEffect(() => {
    const syncAfterMutation = () => {
      if (isClearingAccount.current) return;
      if (sessionUser) void syncAccount(sessionUser);
      else cloudSync.queueSync();
    };
    window.addEventListener('career-os-data-changed', syncAfterMutation);
    return () => window.removeEventListener('career-os-data-changed', syncAfterMutation);
  }, [cloudSync, sessionUser, syncAccount]);

  const signIn = async () => {
    setAuthBusy(true);
    setAuthError(null);
    try {
      const user = await new AuthService().signInWithGoogle();
      AnalyticsService.track({ event: 'user_login', feature: 'authentication' });
      if (user.metadata.creationTime === user.metadata.lastSignInTime) AnalyticsService.track({ event: 'user_signup', feature: 'authentication' });
    } catch (error) {
      setAuthError(getAuthErrorMessage(error));
    } finally {
      setAuthBusy(false);
    }
  };
  const signOut = async () => {
    setAuthBusy(true);
    setAuthError(null);
    try {
      AnalyticsService.track({ event: 'user_logout', feature: 'authentication' });
      await new AuthService().signOut();
      isClearingAccount.current = true;
      cloudSync.stop();
      setSessionUser(null);
      dataService.resetData();
      setCareerDataUpdatedAt(new Date(0).toISOString());
      loadDatabase();
      setCurrentView('dashboard');
      setSyncStatus('offline');
    } catch (error) {
      setAuthError(getAuthErrorMessage(error));
    } finally {
      isClearingAccount.current = false;
      setAuthBusy(false);
    }
  };

  const resetCareerData = useCallback(async () => {
    isClearingAccount.current = true;
    try {
      handleResetData();
      if (sessionUser) await cloudSync.overwrite(sessionUser.uid);
      else cloudSync.stop();
      loadDatabase();
    } finally {
      isClearingAccount.current = false;
    }
  }, [cloudSync, handleResetData, loadDatabase, sessionUser]);

  const refreshAfterAction = () => {
    loadDatabase();
    if (sessionUser) void syncAccount(sessionUser);
    else cloudSync.queueSync();
  };

  // Render active workspace panel
  const renderMainView = () => {
    switch (currentView) {
      case 'dashboard':
        return (
          <DashboardView
            theme={theme}
            opportunities={opportunities}
            progress={progressData}
            timelineEntries={timelineEntries}
            activities={activities}
            certificates={certificates}
            notes={notes}
            onAddOpportunityTrigger={() => setCurrentView('opportunities')}
            onNavigateToView={(view) => setCurrentView(view)}
            level={level}
            xp={totalXP}
            xpForCurrentLevel={xpForCurrentLevel}
            xpProgress={xpProgress}
            streak={streak}
            userName={userName}
            userSchool={userSchool}
            dailyMission={canonicalData?.missions.find((mission) => mission.date === new Date().toISOString().slice(0, 10))}
            onSaveMission={handleSaveMission}
            onDeleteMission={handleDeleteMission}
            careerSnapshot={canonicalData}
          />
        );
      case 'nova':
        return (
          <NovaWorkspace
            theme={theme}
            opportunities={opportunities}
            progress={progressData}
            timeline={timelineEntries}
            certificates={certificates}
            userName={userName}
            onNavigateToView={(view) => setCurrentView(view)}
          />
        );
      case 'opportunities':
        return (
          <OpportunitiesView
            theme={theme}
            opportunities={opportunities}
            onSaveOpportunity={handleSaveOpportunity}
            onDeleteOpportunity={handleDeleteOpportunity}
          />
        );
      case 'upcoming':
        return (
          <UpcomingView
            theme={theme}
            opportunities={opportunities}
            timelineEntries={timelineEntries}
            certificates={certificates}
            progressData={progressData}
            onNavigateToView={(view) => setCurrentView(view)}
          />
        );
      case 'journey':
        return (
          <JourneyView
            theme={theme}
            timelineEntries={timelineEntries}
            onAddTimelineEntry={handleSaveTimelineEntry}
            onDeleteTimelineEntry={handleDeleteTimelineEntry}
          />
        );
      case 'progress':
        return (
          <ProgressView
            theme={theme}
            progressData={progressData}
            onUpdateDailyProgress={handleUpdateDailyProgress}
          />
        );
      case 'certificates':
        return (
          <CertificatesView
            theme={theme}
            certificates={certificates}
            onSaveCertificate={handleSaveCertificate}
            onDeleteCertificate={handleDeleteCertificate}
          />
        );
      case 'notes':
        return (
          <NotesView
            theme={theme}
            notes={notes}
            onSaveNote={handleSaveNote}
            onDeleteNote={handleDeleteNote}
          />
        );
      case 'settings':
        return (
          <SettingsView
            theme={theme}
            onToggleTheme={toggleTheme}
            onRefreshData={loadDatabase}
            onResetData={resetCareerData}
            onLoadSeedData={handleLoadSeedData}
            authUser={sessionUser}
            syncStatus={syncStatus}
            onSignIn={signIn}
            onSignOut={signOut}
            authBusy={authBusy}
            authError={authError}
          />
        );
      default:
        return <div className="text-white text-center py-20">View not found.</div>;
    }
  };

  return (
    <div
      className={`min-h-screen font-sans flex flex-col md:flex-row transition-colors duration-300 relative ${
        theme === 'dark' ? 'bg-slate-950 text-slate-100' : 'bg-slate-50/50 text-slate-800'
      } overflow-hidden`}
    >
      {/* Floating ambient design gradient blurs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] h-[50%] w-[50%] rounded-full bg-indigo-500/5 blur-[120px]" />
        <div className="absolute bottom-[-15%] right-[-10%] h-[60%] w-[60%] rounded-full bg-purple-500/5 blur-[150px]" />
      </div>

      {/* Sidebar Navigation (Desktop) */}
      <Sidebar
        currentView={currentView}
        onViewChange={(view) => setCurrentView(view)}
        theme={theme}
        onToggleTheme={toggleTheme}
        notifications={notifications}
        onMarkNotificationRead={handleMarkNotificationRead}
        userName={userName}
        userSchool={userSchool}
        userGrad={userGrad}
        level={level}
        xp={totalXP}
        xpForCurrentLevel={xpForCurrentLevel}
        xpProgress={xpProgress}
        streak={streak}
      />

      {/* Mobile Top Header & Mobile Bottom Navigation */}
      <MobileNavigation
        currentView={currentView}
        onViewChange={(view) => setCurrentView(view)}
        theme={theme}
        onToggleTheme={toggleTheme}
        notifications={notifications}
        onMarkNotificationRead={handleMarkNotificationRead}
        userName={userName}
        userSchool={userSchool}
        userGrad={userGrad}
        level={level}
        xp={totalXP}
        xpForCurrentLevel={xpForCurrentLevel}
        xpProgress={xpProgress}
        streak={streak}
      />

      {/* Main Workspace Frame */}
      <main className="flex-1 h-screen overflow-y-auto px-4 py-4 pb-28 sm:px-6 md:px-10 md:py-8 md:pb-8 relative z-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentView}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="h-full mx-auto w-full max-w-[1800px]"
          >
            {renderMainView()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* The dedicated Nova workspace owns its conversation controls. */}
      {currentView !== 'nova' && <>
        <QuickAddModal theme={theme} onAddOpportunity={handleSaveOpportunity} />
        <AIAssistant
          theme={theme}
          opportunities={opportunities}
          progress={progressData}
          timeline={timelineEntries}
          onActionExecuted={refreshAfterAction}
        />
      </>}
    </div>
  );
}

function getAuthErrorMessage(error: unknown): string {
  const code = typeof error === 'object' && error !== null && 'code' in error && typeof error.code === 'string'
    ? error.code
    : '';
  if (code === 'auth/popup-closed-by-user') return 'Sign-in was cancelled. You can try again whenever you are ready.';
  if (code === 'auth/popup-blocked') return 'Your browser blocked the Google sign-in window. Allow pop-ups for CareerOS and try again.';
  if (code === 'auth/unauthorized-domain') return 'This site is not authorized for Google sign-in yet. Add its domain in Firebase Authentication settings.';
  if (code === 'auth/operation-not-allowed') return 'Google sign-in is not enabled for this Firebase project yet.';
  if (code === 'auth/network-request-failed') return 'CareerOS could not reach Google. Check your connection and try again.';
  return 'Google sign-in could not be completed. Please try again or check the Firebase configuration.';
}
