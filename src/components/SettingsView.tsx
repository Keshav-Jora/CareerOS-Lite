import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Settings,
  Download,
  Upload,
  User,
  ShieldCheck,
  RotateCcw,
  Sparkles,
  Info,
} from 'lucide-react';
import { exportDataJSON, importDataJSON } from '../utils/storage';
import type { User as FirebaseUser } from 'firebase/auth';
import { AuthControls } from './AuthControls';

interface SettingsViewProps {
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  onRefreshData: () => void;
  onResetData?: () => Promise<void> | void;
  onLoadSeedData?: () => void;
  authUser: FirebaseUser | null;
  syncStatus: 'synced' | 'syncing' | 'offline';
  onSignIn: () => void;
  onSignOut: () => void;
  authBusy: boolean;
  authError: string | null;
}

export default function SettingsView({ theme, onToggleTheme, onRefreshData, onResetData, onLoadSeedData, authUser, syncStatus, onSignIn, onSignOut, authBusy, authError }: SettingsViewProps) {
  // Local Profile Settings (persisted to LocalStorage for profile mapping)
  const [name, setName] = useState(() => localStorage.getItem('career_os_user_name') || 'Student');
  const [affiliation, setAffiliation] = useState(
    () => localStorage.getItem('career_os_user_school') || 'Not Set'
  );
  const [gradYear, setGradYear] = useState(() => localStorage.getItem('career_os_user_grad') || 'Not Set');

  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [isResetting, setIsResetting] = useState(false);

  useEffect(() => {
    if (authUser) return;
    setName('Student');
    setAffiliation('Not Set');
    setGradYear('Not Set');
  }, [authUser]);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('career_os_user_name', name);
    localStorage.setItem('career_os_user_school', affiliation);
    localStorage.setItem('career_os_user_grad', gradYear);
    onRefreshData(); // Propagate change to sidebar/parent layout!
    alert('Profile parameters updated and saved to local storage.');
  };

  // Trigger browser download for backup
  const handleExport = () => {
    try {
      const dataStr = exportDataJSON();
      const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);

      const exportFileDefaultName = `career_os_lite_backup_${new Date().toISOString().split('T')[0]}.json`;

      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
    } catch (e) {
      console.error('Failed to export backup JSON', e);
    }
  };

  // Read upload JSON backup
  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    const file = e.target.files?.[0];
    if (!file) return;

    fileReader.onload = (event) => {
      const result = event.target?.result;
      if (typeof result === 'string') {
        const success = importDataJSON(result);
        if (success) {
          setImportStatus('success');
          onRefreshData();
          setTimeout(() => {
            window.location.reload(); // Refresh to populate new database states
          }, 1000);
        } else {
          setImportStatus('error');
        }
      }
    };
    fileReader.readAsText(file);
  };

  // Reset to empty fresh user state
  const handleResetApp = async () => {
    const isConfirmed = confirm(
      'Are you absolutely sure you want to reset CareerOS Lite? This will completely clear all local data (XP = 0, Level = 1, empty opportunities, empty logs).'
    );
    if (isConfirmed) {
      setIsResetting(true);
      try {
        if (onResetData) await onResetData();
        else localStorage.clear();
        alert('CareerOS Lite data has been successfully reset.');
      } catch (error) {
        console.error('CareerOS reset failed.', error);
        alert('CareerOS could not finish the cloud reset. Check your connection and try again.');
      } finally {
        setIsResetting(false);
      }
    }
  };

  const handleLoadDemoData = () => {
    const isConfirmed = confirm(
      'Load demo sample data into CareerOS Lite? This will populate sample opportunities, certificates, and progress entries for testing.'
    );
    if (isConfirmed) {
      if (onLoadSeedData) {
        onLoadSeedData();
      }
      alert('Demo sample data loaded successfully!');
      window.location.reload();
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto p-1 pb-32 md:pb-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-white md:text-3xl">
          System Options
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Configure profile metrics, manage offline local data pipelines, and back up databases.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Span: Profile Configuration */}
        <div className="md:col-span-2 space-y-6">
          <div className={`p-5 rounded-2xl border ${theme === 'dark' ? 'glass-panel-dark' : 'glass-panel-light'}`}>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Account & Sync</p>
            <div className="mt-3 flex items-center justify-between gap-4"><div><p className="text-sm font-semibold text-slate-100">{authUser ? authUser.displayName ?? 'CareerOS Account' : 'Guest profile'}</p><p className="mt-1 text-xs text-slate-400">{authUser ? authUser.email : 'Sign in to keep your career data synced across devices.'}</p></div><AuthControls user={authUser} syncStatus={syncStatus} onSignIn={onSignIn} onSignOut={onSignOut} busy={authBusy} /></div>
            {authError && <p role="alert" className="mt-3 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs leading-5 text-rose-200">{authError}</p>}
          </div>
          {authUser && <div
            className={`p-5 rounded-2xl border ${
              theme === 'dark' ? 'glass-panel-dark' : 'glass-panel-light'
            } space-y-4`}
          >
            <div className="flex items-center gap-2 pb-3 border-b border-slate-800/20">
              <User className="h-5 w-5 text-indigo-400" />
              <h3 className="font-display font-bold text-sm text-slate-200">User Identity Mapping</h3>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Full name */}
                <div className="space-y-1">
                  <label className="font-semibold uppercase tracking-wider text-slate-400 text-[10px]">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={`w-full px-3 py-2.5 rounded-xl border focus:outline-none transition-all ${
                      theme === 'dark'
                        ? 'bg-slate-950/40 border-slate-800 text-slate-100 focus:border-indigo-500/50'
                        : 'bg-white border-slate-200'
                    }`}
                  />
                </div>

                {/* Affiliation */}
                <div className="space-y-1">
                  <label className="font-semibold uppercase tracking-wider text-slate-400 text-[10px]">
                    University / Affiliation
                  </label>
                  <input
                    type="text"
                    value={affiliation}
                    onChange={(e) => setAffiliation(e.target.value)}
                    className={`w-full px-3 py-2.5 rounded-xl border focus:outline-none transition-all ${
                      theme === 'dark'
                        ? 'bg-slate-950/40 border-slate-800 text-slate-100 focus:border-indigo-500/50'
                        : 'bg-white border-slate-200'
                    }`}
                  />
                </div>
              </div>

              {/* Graduation Year */}
              <div className="space-y-1">
                <label className="font-semibold uppercase tracking-wider text-slate-400 text-[10px]">
                  Graduation Cohort / Year
                </label>
                <input
                  type="text"
                  value={gradYear}
                  onChange={(e) => setGradYear(e.target.value)}
                  className={`w-full px-3 py-2.5 rounded-xl border focus:outline-none transition-all ${
                    theme === 'dark'
                      ? 'bg-slate-950/40 border-slate-800 text-slate-100 focus:border-indigo-500/50'
                      : 'bg-white border-slate-200'
                  }`}
                  placeholder="e.g. 2027"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white font-semibold hover:bg-slate-700 hover:border-slate-650 transition-all shadow-sm"
                >
                  Apply Profile Updates
                </button>
              </div>
            </form>
          </div>}

          {/* Local storage sync options */}
          <div
            className={`p-5 rounded-2xl border ${
              theme === 'dark' ? 'glass-panel-dark' : 'glass-panel-light'
            } space-y-4`}
          >
            <div className="flex items-center gap-2 pb-3 border-b border-slate-800/20">
              <ShieldCheck className="h-5 w-5 text-emerald-400" />
              <h3 className="font-display font-bold text-sm text-slate-200">Database Storage Pipeline</h3>
            </div>

            <div className="space-y-3 text-xs text-slate-350 leading-relaxed">
              <p>
                CareerOS Lite stores all telemetry, journal dates, opportunity lists, and certificates in a secure local database inside your browser&apos;s sandboxed cache (**Local Storage**).
              </p>
              <p>
                This ensures high-speed, latency-free lookups, absolute personal data privacy, and 100% offline-ready operations. No account registration or external tracking is active.
              </p>

              <div className="p-3.5 bg-slate-900/40 border border-slate-800 rounded-xl flex items-start gap-2 text-slate-400">
                <Info className="h-4.5 w-4.5 text-indigo-400 shrink-0 mt-0.5" />
                <span className="text-[11px]">
                  Note: Clearing your browser cookie archive or application site storage cache will erase your local history. Make sure to download regular backup files!
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Span: Data Operations (Export / Import) */}
        <div className="space-y-6">
          <div
            className={`p-5 rounded-2xl border ${
              theme === 'dark' ? 'glass-panel-dark' : 'glass-panel-light'
            } space-y-4`}
          >
            <div className="flex items-center gap-2 pb-3 border-b border-slate-800/20">
              <Settings className="h-5 w-5 text-indigo-400" />
              <h3 className="font-display font-bold text-sm text-slate-200">Import &amp; Export</h3>
            </div>

            <div className="space-y-3.5">
              {/* Export backup */}
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">Create Backup</span>
                <button
                  onClick={handleExport}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-xs shadow-md glow-blue transition-all flex items-center justify-center gap-1.5"
                >
                  <Download className="h-4 w-4" /> Download JSON Backup
                </button>
              </div>

              {/* Import backup */}
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">Restore Database</span>
                <label
                  className={`w-full py-2.5 rounded-xl border flex items-center justify-center gap-1.5 cursor-pointer text-xs font-semibold hover:text-white transition-all ${
                    theme === 'dark'
                      ? 'bg-slate-900 border-slate-800 text-slate-350 hover:bg-slate-850 hover:border-slate-700'
                      : 'bg-white border-slate-200 text-slate-600'
                  }`}
                >
                  <Upload className="h-4 w-4" /> Import Backup JSON
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportFile}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Status display */}
              <AnimatePresence>
                {importStatus === 'success' && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-center text-[11px] text-emerald-400 font-bold"
                  >
                    ✓ Database Restored! Refreshing...
                  </motion.div>
                )}
                {importStatus === 'error' && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="p-2.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-center text-[11px] text-rose-400 font-bold"
                  >
                    ⚠ Failed to parse JSON database.
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Hard reset system parameters */}
          <div
            className={`p-5 rounded-2xl border ${
              theme === 'dark' ? 'glass-panel-dark' : 'glass-panel-light'
            } space-y-4`}
          >
            <div className="flex items-center gap-2 pb-3 border-b border-slate-800/20">
              <RotateCcw className="h-4.5 w-4.5 text-rose-500" />
              <h3 className="font-display font-bold text-sm text-slate-200">System Reset</h3>
            </div>

            <div className="space-y-3 text-xs text-slate-400 leading-relaxed">
              <p>
                Erase all local state entries, resetting CareerOS Lite to an empty user account (0 XP, Level 1). Or load sample data for testing.
              </p>
              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  onClick={handleResetApp}
                  disabled={isResetting}
                  className="w-full py-2.5 rounded-xl border border-rose-500/20 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 font-bold text-xs transition-colors shadow-sm text-center cursor-pointer disabled:cursor-wait disabled:opacity-60"
                >
                  {isResetting ? 'Resetting Career Data...' : 'Reset Career Data (Clear All)'}
                </button>
                {onLoadSeedData && (
                  <button
                    type="button"
                    onClick={handleLoadDemoData}
                    className="w-full py-2.5 rounded-xl border border-indigo-500/20 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 font-bold text-xs transition-colors shadow-sm text-center cursor-pointer"
                  >
                    Load Demo / Sample Data
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
