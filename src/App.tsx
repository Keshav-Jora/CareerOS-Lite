import { useCallback, useEffect, useMemo, useState } from 'react';
import type { User } from 'firebase/auth';
import { motion, AnimatePresence } from 'motion/react';

// Hooks & Services Architecture
import { useTheme } from './hooks/useTheme';
import { useAppData } from './hooks/useAppData';
import { CloudSyncService } from './services/cloud/CloudSyncService';
import { SessionManager } from './services/auth/SessionManager';
import { AuthService } from './services/auth/AuthService';
import { AuthControls } from './components/AuthControls';

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
  const cloudSync = useMemo(() => new CloudSyncService(), []);

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
    handleSaveCertificate,
    handleDeleteCertificate,
    handleSaveNote,
    handleDeleteNote,
    handleMarkNotificationRead,
    handleResetData,
    handleLoadSeedData,
  } = useAppData();

  const { totalXP, level, xpForCurrentLevel, xpProgress, streak } = gamification;

  const syncAccount = useCallback(async (user: User) => { setSyncStatus(navigator.onLine ? 'syncing' : 'offline'); try { await cloudSync.sync(user.uid); setSyncStatus(navigator.onLine ? 'synced' : 'offline'); } catch { setSyncStatus('offline'); } }, [cloudSync]);
  useEffect(() => new SessionManager().observe((user) => {
    setSessionUser(user);
    if (user) void syncAccount(user).finally(loadDatabase); else setSyncStatus('offline');
  }), [loadDatabase, syncAccount]);

  useEffect(() => {
    const flushQueue = () => { if (sessionUser) void syncAccount(sessionUser); };
    window.addEventListener('online', flushQueue);
    return () => window.removeEventListener('online', flushQueue);
  }, [sessionUser, syncAccount]);
  const signIn = async () => { setAuthBusy(true); try { await new AuthService().signInWithGoogle(); } finally { setAuthBusy(false); } };
  const signOut = async () => { setAuthBusy(true); try { await new AuthService().signOut(); setSyncStatus('offline'); } finally { setAuthBusy(false); } };

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
            onResetData={handleResetData}
            onLoadSeedData={handleLoadSeedData}
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
      <main className="flex-1 h-screen overflow-y-auto px-4 sm:px-6 md:px-10 py-4 md:py-8 pb-28 md:pb-8 relative z-10">
        <div className="absolute right-4 top-4 z-20 sm:right-6 md:right-10 md:top-6"><AuthControls user={sessionUser} syncStatus={syncStatus} onSignIn={signIn} onSignOut={signOut} busy={authBusy} /></div>
        {!sessionUser && <div className="mx-auto mb-5 flex max-w-7xl items-center justify-between gap-3 rounded-2xl border border-indigo-400/15 bg-indigo-500/5 px-4 py-3 pr-40 text-xs text-slate-300"><span><strong>Guest Mode.</strong> Sign in to sync your career data across devices.</span><button type="button" onClick={signIn} className="shrink-0 font-semibold text-indigo-300 hover:text-indigo-200">Continue with Google</button></div>}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentView}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="h-full"
          >
            {renderMainView()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Floating Quick Action triggers (Quick Add Opportunity & AI Assistant) */}
      <QuickAddModal theme={theme} onAddOpportunity={handleSaveOpportunity} />
      <AIAssistant
        theme={theme}
        opportunities={opportunities}
        progress={progressData}
        timeline={timelineEntries}
        onActionExecuted={refreshAfterAction}
      />
    </div>
  );
}
