import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  LayoutDashboard,
  Sparkles,
  Briefcase,
  CalendarClock,
  Milestone,
  TrendingUp,
  Award,
  FileText,
  Settings,
  Bell,
  Sun,
  Moon,
  LogOut,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  AlertTriangle,
  Info,
  Zap,
} from 'lucide-react';
import { AppNotification } from '../types';

interface SidebarProps {
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

export default function Sidebar({
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
  xp = 0,
  xpForCurrentLevel = 0,
  xpProgress = 0,
  streak = 0,
}: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const notificationMenuRef = useRef<HTMLDivElement>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    const closeMenus = (event: MouseEvent) => {
      if (!notificationMenuRef.current?.contains(event.target as Node)) setShowNotifications(false);
      if (!profileMenuRef.current?.contains(event.target as Node)) setShowProfileMenu(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setShowNotifications(false);
      setShowProfileMenu(false);
    };
    document.addEventListener('mousedown', closeMenus);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('mousedown', closeMenus);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, []);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'nova', label: 'Nova AI Workspace', icon: Sparkles },
    { id: 'opportunities', label: 'Opportunities', icon: Briefcase },
    { id: 'upcoming', label: 'Upcoming', icon: CalendarClock },
    { id: 'journey', label: 'Journey', icon: Milestone },
    { id: 'progress', label: 'Progress', icon: TrendingUp },
    { id: 'certificates', label: 'Certificates', icon: Award },
    { id: 'notes', label: 'Notes', icon: FileText },
    { id: 'settings', label: 'Settings', icon: Settings },
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

  return (
    <motion.div
      animate={{ width: isCollapsed ? '80px' : '260px' }}
      className={`relative h-screen flex flex-col justify-between border-r shrink-0 transition-colors duration-200 ${
        theme === 'dark'
          ? 'glass-panel-dark border-slate-800 text-slate-200'
          : 'glass-panel-light border-slate-200 text-slate-800'
      } z-30 hidden md:flex`}
    >
      {/* Collapse Toggle */}
      <button
        type="button"
        onClick={() => setIsCollapsed(!isCollapsed)}
        id="sidebar-toggle"
        aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        aria-expanded={!isCollapsed}
        className={`absolute top-6 -right-3 flex h-6 w-6 items-center justify-center rounded-full border shadow-md transition-all duration-200 hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
          theme === 'dark'
            ? 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
            : 'bg-white border-slate-200 text-slate-500 hover:text-slate-900'
        }`}
      >
        {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

      {/* Header */}
      <div>
        <div className="p-6 flex items-center gap-3">
          <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 shadow-lg glow-blue">
            <Sparkles className="h-5 w-5 text-white animate-pulse" aria-hidden="true" />
          </div>
          <AnimatePresence>
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="flex flex-col overflow-hidden"
              >
                <span className="font-display text-lg font-bold tracking-tight bg-gradient-to-r from-indigo-500 via-purple-400 to-pink-500 bg-clip-text text-transparent">
                  CareerOS
                </span>
                <span className="text-[10px] font-mono tracking-widest text-slate-400 uppercase font-medium">
                  Lite v0.1
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Navigation Items */}
        <nav className="px-4 space-y-1.5" aria-label="Main Navigation">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                type="button"
                key={item.id}
                id={`sidebar-nav-${item.id}`}
                onClick={() => onViewChange(item.id)}
                aria-label={item.label}
                aria-current={isActive ? 'page' : undefined}
                className={`w-full min-h-11 flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                  isActive
                    ? theme === 'dark'
                      ? 'bg-indigo-600/15 text-indigo-300 border border-indigo-400/30 shadow-[0_8px_22px_-16px_rgba(129,140,248,0.9)]'
                      : 'bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-[0_8px_22px_-16px_rgba(79,70,229,0.45)]'
                    : theme === 'dark'
                    ? 'text-slate-400 hover:-translate-y-px hover:bg-slate-800/60 hover:text-slate-100 hover:border-slate-700/70 border border-transparent'
                    : 'text-slate-600 hover:-translate-y-px hover:bg-slate-100 hover:text-slate-900 hover:border-slate-200 border border-transparent'
                }`}
              >
                <Icon
                  aria-hidden="true"
                  className={`h-5 w-5 shrink-0 transition-transform duration-300 group-hover:scale-110 ${
                    isActive ? 'text-indigo-500' : 'text-slate-400 group-hover:text-slate-300'
                  }`}
                />
                {!isCollapsed && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="truncate"
                  >
                    {item.label}
                  </motion.span>
                )}
                {/* Active Dot indicator */}
                {isActive && !isCollapsed && (
                  <motion.div
                    layoutId="activeDot"
                    className="ml-auto h-1.5 w-1.5 rounded-full bg-indigo-500"
                  />
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Settings & Notification Panel */}
      <div className="p-4 space-y-3">
        {/* Toggle Theme / Notifications bar */}
        <div className="flex items-center justify-between gap-2">
          {/* Notifications */}
          <div ref={notificationMenuRef} className="relative">
            <button
              type="button"
              id="notifications-panel-trigger"
              onClick={() => setShowNotifications(!showNotifications)}
              aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ''}`}
              aria-expanded={showNotifications}
              aria-haspopup="true"
              className={`min-h-11 min-w-11 p-2 rounded-xl border transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                theme === 'dark'
                  ? 'bg-slate-900/50 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800/50'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Bell className="h-4 w-4" aria-hidden="true" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white ring-2 ring-slate-950">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notification Dropdown Panel */}
            <AnimatePresence>
              {showNotifications && (
                <motion.div
                  initial={{ opacity: 0, y: 15, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 15, scale: 0.95 }}
                  role="region"
                  aria-label="Notifications panel"
                  className={`absolute bottom-12 left-0 w-80 rounded-xl border shadow-xl p-4 overflow-hidden ${
                    theme === 'dark'
                      ? 'bg-slate-900/95 border-slate-800 text-slate-200'
                      : 'bg-white/95 border-slate-200 text-slate-800'
                  } backdrop-blur-md z-40`}
                >
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800/40">
                    <h4 className="font-display font-semibold text-xs uppercase tracking-wider text-slate-400">
                      Reminders & Alerts
                    </h4>
                    {unreadCount > 0 && (
                      <span className="text-[10px] bg-rose-500/15 text-rose-400 px-1.5 py-0.5 rounded-full font-medium">
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  <div className="max-h-60 overflow-y-auto space-y-2.5 pr-1" role="status" aria-live="polite">
                    {notifications.length === 0 ? (
                      <p className="text-xs text-slate-500 text-center py-4">No notifications yet.</p>
                    ) : (
                      notifications.map((not) => (
                        <div
                          key={not.id}
                          className={`p-2.5 rounded-lg border transition-all text-left ${
                            not.read
                              ? 'bg-transparent border-transparent opacity-60'
                              : theme === 'dark'
                              ? 'bg-slate-800/40 border-slate-800 hover:bg-slate-800/60'
                              : 'bg-slate-50 border-slate-100 hover:bg-slate-100'
                          }`}
                        >
                          <div className="flex items-start gap-2">
                            <span className="mt-0.5 shrink-0">{getNotificationIcon(not.type)}</span>
                            <div className="space-y-0.5">
                              <h5 className="font-medium text-xs text-slate-200 leading-tight">
                                {not.title}
                              </h5>
                              <p className="text-[11px] text-slate-400 leading-normal">{not.message}</p>
                              {!not.read && (
                                <button
                                  type="button"
                                  onClick={() => onMarkNotificationRead(not.id)}
                                  className="text-[10px] text-indigo-400 hover:text-indigo-300 font-medium pt-1 block focus-visible:outline-none focus-visible:underline"
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

          {/* Theme Switcher */}
          <button
            type="button"
            id="theme-toggle"
            onClick={onToggleTheme}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            className={`min-h-11 rounded-xl border flex-1 flex justify-center items-center gap-1.5 text-xs font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
              theme === 'dark'
                ? 'bg-slate-900/50 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800/50'
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            {theme === 'dark' ? (
              <>
                <Sun className="h-4 w-4" aria-hidden="true" />
                {!isCollapsed && <span>Light</span>}
              </>
            ) : (
              <>
                <Moon className="h-4 w-4" aria-hidden="true" />
                {!isCollapsed && <span>Dark</span>}
              </>
            )}
          </button>
        </div>

        {/* User Card */}
        <div ref={profileMenuRef} className="relative space-y-2">
          <button
            type="button"
            onClick={() => setShowProfileMenu((open) => !open)}
            aria-label="Open account menu"
            aria-expanded={showProfileMenu}
            aria-haspopup="menu"
            className={`w-full min-h-14 flex items-center gap-3 p-2.5 rounded-xl border text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
              theme === 'dark'
                ? 'bg-slate-900/40 border-slate-800/60 hover:bg-slate-800/70'
                : 'bg-slate-50/50 border-slate-200/60 hover:bg-slate-100'
            }`}
          >
            <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-lg bg-slate-700">
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=256&auto=format&fit=crop"
                alt="User profile"
                className="h-full w-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-slate-950" />
            </div>
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col min-w-0"
              >
                <span className="text-xs font-semibold truncate text-slate-100">{userName}</span>
                <span className="text-[10px] font-medium text-slate-400 truncate">{userSchool} &apos;{userGrad.slice(-2)}</span>
              </motion.div>
            )}
          </button>
          <AnimatePresence>
            {showProfileMenu && !isCollapsed && (
              <motion.div
                initial={{ opacity: 0, y: 6, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 6, scale: 0.98 }}
                transition={{ duration: 0.16 }}
                role="menu"
                aria-label="Account menu"
                className={`absolute bottom-full left-0 right-0 z-50 mb-2 rounded-xl border p-1.5 shadow-xl ${theme === 'dark' ? 'border-slate-700 bg-slate-900/95 text-slate-200' : 'border-slate-200 bg-white/95 text-slate-800'} backdrop-blur-xl`}
              >
                <button type="button" role="menuitem" onClick={() => { onViewChange('settings'); setShowProfileMenu(false); }} className="flex min-h-10 w-full items-center rounded-lg px-3 text-left text-xs font-semibold hover:bg-indigo-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500">
                  Account settings
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Gamification Panel in Sidebar */}
          {!isCollapsed && (
            <div className="px-1 py-0.5 space-y-1.5">
              <div className="flex justify-between items-center text-[10px]">
                <span className="font-semibold text-indigo-400 flex items-center gap-1">
                  <Sparkles className="h-3 w-3 text-indigo-400" />
                  Level {level}
                </span>
                <span className="font-mono text-slate-500">{xpForCurrentLevel}/1000 XP</span>
              </div>
              <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${xpProgress}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                />
              </div>
              {streak > 0 && (
                <div className="flex items-center gap-1 text-[10px] text-amber-400 font-semibold animate-pulse">
                  <Zap className="h-3 w-3 fill-current" />
                  <span>{streak} Day work streak!</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
