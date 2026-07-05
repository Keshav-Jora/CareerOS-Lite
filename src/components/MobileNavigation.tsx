import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Home,
  Briefcase,
  Milestone,
  Sparkles,
  User,
  LayoutDashboard,
  CalendarClock,
  TrendingUp,
  Award,
  FileText,
  Settings,
  Bell,
  Sun,
  Moon,
  CheckCircle,
  AlertTriangle,
  Info,
  Zap,
  Menu,
  X,
  ChevronRight,
} from 'lucide-react';
import { AppNotification } from '../types';

interface MobileNavigationProps {
  currentView: string;
  onViewChange: (view: string) => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  notifications: AppNotification[];
  onMarkNotificationRead: (id: string) => void;
  userName?: string;
  userSchool?: string;
  userGrad?: string;
  level?: number;
  xp?: number;
  xpForCurrentLevel?: number;
  xpProgress?: number;
  streak?: number;
}

export default function MobileNavigation({
  currentView,
  onViewChange,
  theme,
  onToggleTheme,
  notifications,
  onMarkNotificationRead,
  userName = 'Student',
  userSchool = 'Not Set',
  userGrad = 'Not Set',
  level = 1,
  xpForCurrentLevel = 0,
  xpProgress = 0,
  streak = 0,
}: MobileNavigationProps) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const menuItems = [
    { id: 'dashboard', label: 'Home Dashboard', icon: Home },
    { id: 'opportunities', label: 'Opportunities', icon: Briefcase },
    { id: 'journey', label: 'Career Journey', icon: Milestone },
    { id: 'nova', label: 'Nova AI Assistant', icon: Sparkles },
    { id: 'settings', label: 'Profile & Settings', icon: User },
    { id: 'upcoming', label: 'Upcoming Deadlines', icon: CalendarClock },
    { id: 'progress', label: 'Velocity Progress', icon: TrendingUp },
    { id: 'certificates', label: 'Certificates', icon: Award },
    { id: 'notes', label: 'Knowledge Hub', icon: FileText },
  ];

  // ONLY 5 bottom navigation items as explicitly requested: Home, Opportunities, Journey, Nova, Profile
  const bottomNavItems = [
    { id: 'dashboard', label: 'Home', icon: Home },
    { id: 'opportunities', label: 'Opportunities', icon: Briefcase },
    { id: 'journey', label: 'Journey', icon: Milestone },
    { id: 'nova', label: 'Nova', icon: Sparkles, isAi: true },
    { id: 'settings', label: 'Profile', icon: User },
  ];

  const getNotificationIcon = (type: AppNotification['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-emerald-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      default:
        return <Info className="h-4 w-4 text-indigo-500" />;
    }
  };

  const handleNavClick = (id: string) => {
    if (id === 'nova') {
      window.dispatchEvent(new CustomEvent('open-ai-assistant'));
    } else {
      onViewChange(id);
      setIsDrawerOpen(false);
    }
  };

  return (
    <div className="md:hidden">
      {/* Mobile Sticky Top Header */}
      <header
        className={`sticky top-0 z-30 w-full border-b backdrop-blur-xl px-4 py-2.5 flex items-center justify-between transition-colors duration-300 ${
          theme === 'dark'
            ? 'bg-slate-950/85 border-slate-800/80 text-slate-100'
            : 'bg-white/85 border-slate-200/80 text-slate-900'
        }`}
      >
        {/* Brand */}
        <div
          onClick={() => onViewChange('dashboard')}
          className="flex items-center gap-2 cursor-pointer select-none"
        >
          <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-tr from-indigo-600 to-purple-600 shadow-md">
            <Sparkles className="h-4 w-4 text-white animate-pulse" aria-hidden="true" />
          </div>
          <div className="flex flex-col">
            <span className="font-display text-base font-bold tracking-tight bg-gradient-to-r from-indigo-500 via-purple-400 to-pink-500 bg-clip-text text-transparent">
              CareerOS
            </span>
            <span className="text-[9px] font-mono tracking-widest text-slate-400 uppercase font-medium leading-none">
              Lite
            </span>
          </div>
        </div>

        {/* Action Cluster */}
        <div className="flex items-center gap-2">
          {/* Level & Streak Pill */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[11px] font-semibold">
            <Zap className="h-3 w-3 fill-amber-400 text-amber-400" />
            <span>Lvl {level}</span>
            {streak > 0 && <span className="text-amber-400">· {streak}d</span>}
          </div>

          {/* Notifications Button */}
          <div className="relative">
            <button
              type="button"
              id="mobile-notifications-trigger"
              onClick={() => setShowNotifications(!showNotifications)}
              aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ''}`}
              aria-expanded={showNotifications}
              className={`p-2.5 rounded-xl border transition-all min-h-[40px] min-w-[40px] flex items-center justify-center cursor-pointer ${
                theme === 'dark'
                  ? 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white'
                  : 'bg-slate-100/80 border-slate-200 text-slate-600 hover:text-slate-900'
              }`}
            >
              <Bell className="h-4 w-4" aria-hidden="true" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Mobile Notification Dropdown */}
            <AnimatePresence>
              {showNotifications && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className={`absolute right-0 top-11 w-72 rounded-2xl border shadow-2xl p-4 overflow-hidden ${
                    theme === 'dark'
                      ? 'bg-slate-900/95 border-slate-800 text-slate-200'
                      : 'bg-white/95 border-slate-200 text-slate-800'
                  } backdrop-blur-md z-50`}
                >
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800/40">
                    <h4 className="font-display font-semibold text-xs uppercase tracking-wider text-slate-400">
                      Notifications
                    </h4>
                    {unreadCount > 0 && (
                      <span className="text-[10px] bg-rose-500/15 text-rose-400 px-1.5 py-0.5 rounded-full font-medium">
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
                    {notifications.length === 0 ? (
                      <p className="text-xs text-slate-500 text-center py-4">No notifications yet.</p>
                    ) : (
                      notifications.map((not) => (
                        <div
                          key={not.id}
                          className={`p-2 rounded-lg border text-left ${
                            not.read
                              ? 'bg-transparent border-transparent opacity-60'
                              : theme === 'dark'
                              ? 'bg-slate-800/50 border-slate-800'
                              : 'bg-slate-50 border-slate-100'
                          }`}
                        >
                          <div className="flex items-start gap-2">
                            <span className="mt-0.5 shrink-0">{getNotificationIcon(not.type)}</span>
                            <div className="space-y-0.5 flex-1">
                              <h5 className="font-medium text-xs leading-tight">{not.title}</h5>
                              <p className="text-[11px] text-slate-400 leading-normal">{not.message}</p>
                              {!not.read && (
                                <button
                                  type="button"
                                  onClick={() => onMarkNotificationRead(not.id)}
                                  className="text-[10px] text-indigo-400 hover:text-indigo-300 font-medium pt-1 block"
                                >
                                  Mark as read
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Mobile Theme Switcher */}
          <button
            type="button"
            id="mobile-theme-toggle"
            onClick={onToggleTheme}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            className={`p-2.5 rounded-xl border transition-all min-h-[40px] min-w-[40px] flex items-center justify-center cursor-pointer ${
              theme === 'dark'
                ? 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white'
                : 'bg-slate-100/80 border-slate-200 text-slate-600 hover:text-slate-900'
            }`}
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          {/* Menu Drawer Toggle */}
          <button
            type="button"
            id="mobile-drawer-toggle"
            onClick={() => setIsDrawerOpen(!isDrawerOpen)}
            aria-label={isDrawerOpen ? 'Close navigation drawer' : 'Open navigation drawer'}
            aria-expanded={isDrawerOpen}
            className={`p-2.5 rounded-xl border transition-all min-h-[40px] min-w-[40px] flex items-center justify-center cursor-pointer ${
              theme === 'dark'
                ? 'bg-indigo-600/20 border-indigo-500/30 text-indigo-400'
                : 'bg-indigo-50 border-indigo-100 text-indigo-600'
            }`}
          >
            {isDrawerOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </header>

      {/* Mobile Drawer Overlay */}
      <AnimatePresence>
        {isDrawerOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDrawerOpen(false)}
              className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-40"
            />

            {/* Slide-over Drawer */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className={`fixed inset-y-0 right-0 w-80 max-w-[85vw] border-l shadow-2xl p-5 flex flex-col justify-between overflow-y-auto z-50 ${
                theme === 'dark'
                  ? 'bg-slate-900/98 border-slate-800 text-slate-100'
                  : 'bg-white/98 border-slate-200 text-slate-900'
              } backdrop-blur-2xl`}
            >
              <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-800/50">
                  <div className="flex items-center gap-3">
                    <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl bg-slate-700">
                      <img
                        src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=256&auto=format&fit=crop"
                        alt="User profile"
                        className="h-full w-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-slate-950" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-bold truncate">{userName}</span>
                      <span className="text-xs text-slate-400 truncate">
                        {userSchool} &apos;{userGrad.slice(-2)}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsDrawerOpen(false)}
                    className="p-2 rounded-xl text-slate-400 hover:text-white cursor-pointer"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Gamification Bar */}
                <div className="p-3.5 rounded-xl bg-indigo-950/30 border border-indigo-500/20 space-y-2">
                  <div className="flex justify-between items-center text-xs font-semibold">
                    <span className="text-indigo-400 flex items-center gap-1">
                      <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
                      Level {level} Pathfinder
                    </span>
                    <span className="font-mono text-slate-400 text-[10px]">{xpForCurrentLevel}/1000 XP</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 transition-all duration-500"
                      style={{ width: `${xpProgress}%` }}
                    />
                  </div>
                </div>

                {/* Menu Nav Links */}
                <nav className="space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-2 block">
                    Workspace Navigation
                  </span>
                  {menuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = currentView === item.id;
                    return (
                      <button
                        type="button"
                        key={item.id}
                        id={`mobile-nav-${item.id}`}
                        onClick={() => handleNavClick(item.id)}
                        className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-medium transition-all min-h-[44px] cursor-pointer ${
                          isActive
                            ? theme === 'dark'
                              ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/30 shadow-sm'
                              : 'bg-indigo-50 text-indigo-600 border border-indigo-100 shadow-sm'
                            : theme === 'dark'
                            ? 'text-slate-300 hover:bg-slate-800/50'
                            : 'text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className={`h-5 w-5 ${isActive ? 'text-indigo-500' : 'text-slate-400'}`} />
                          <span>{item.label}</span>
                        </div>
                        <ChevronRight className={`h-4 w-4 ${isActive ? 'text-indigo-500' : 'text-slate-600'}`} />
                      </button>
                    );
                  })}
                </nav>
              </div>

              {/* Drawer Footer */}
              <div className="pt-4 border-t border-slate-800/50 flex items-center justify-between">
                <button
                  type="button"
                  onClick={onToggleTheme}
                  className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white cursor-pointer"
                >
                  {theme === 'dark' ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-indigo-400" />}
                  <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
                </button>
                <span className="text-[10px] font-mono text-slate-500">CareerOS Lite v0.1</span>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Mobile Fixed Bottom Navigation Bar - Thumb-Friendly 5-Item Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 p-2 pointer-events-none">
        <nav
          className={`pointer-events-auto max-w-md mx-auto rounded-2xl border backdrop-blur-2xl px-1.5 py-1.5 grid grid-cols-5 items-center justify-between shadow-2xl transition-all duration-300 ${
            theme === 'dark'
              ? 'bg-slate-950/95 border-slate-800/90 text-slate-200 shadow-slate-950/80'
              : 'bg-white/95 border-slate-200/90 text-slate-800 shadow-slate-200/50'
          }`}
          aria-label="Mobile Bottom Navigation"
        >
          {bottomNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            const isAi = item.isAi;

            return (
              <button
                type="button"
                key={item.id}
                id={`mobile-bottom-tab-${item.id}`}
                onClick={() => handleNavClick(item.id)}
                aria-label={item.label}
                className={`relative flex flex-col items-center justify-center py-2 px-1 min-h-[52px] rounded-xl transition-all active:scale-95 cursor-pointer focus-visible:outline-none select-none ${
                  isActive
                    ? 'text-indigo-400 font-bold'
                    : theme === 'dark'
                    ? 'text-slate-400 hover:text-slate-200'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="mobileActiveTab"
                    className="absolute inset-0 rounded-xl bg-indigo-500/15 border border-indigo-500/30 shadow-sm"
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                  />
                )}

                {/* Icon rendering with special badge for Nova */}
                {isAi ? (
                  <div className="relative">
                    <div className="h-6 w-6 rounded-lg bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 p-0.5 flex items-center justify-center shadow-md">
                      <Icon className="h-4 w-4 text-white" />
                    </div>
                    <span className="absolute -top-1 -right-1 flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
                    </span>
                  </div>
                ) : (
                  <Icon
                    className={`h-5 w-5 relative z-10 transition-transform ${
                      isActive ? 'scale-110 text-indigo-400' : ''
                    }`}
                  />
                )}

                <span
                  className={`text-[10px] tracking-tight mt-1 relative z-10 font-medium truncate max-w-[64px] ${
                    isActive ? 'font-bold text-indigo-400' : ''
                  }`}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}

