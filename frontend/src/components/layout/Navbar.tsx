import React, { useEffect, useState, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  ShieldAlert,
  Activity,
  LogIn,
  UserPlus,
  LogOut,
  User as UserIcon,
  Bell,
  CheckCheck,
  ArrowRight,
} from 'lucide-react';
import { checkHealth } from '../../api/health';
import {
  getUnreadNotificationCount,
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from '../../api/notification';
import { useAuth } from '../../context/AuthContext';
import type { UserRole, NotificationItem } from '../../types';

export const Navbar: React.FC = () => {
  const [isHealthy, setIsHealthy] = useState<boolean | null>(null);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [recentNotifications, setRecentNotifications] = useState<NotificationItem[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();

  useEffect(() => {
    checkHealth()
      .then((res) => setIsHealthy(res.status === 'UP'))
      .catch(() => setIsHealthy(false));
  }, []);

  const loadUnreadCount = () => {
    if (isAuthenticated) {
      getUnreadNotificationCount()
        .then((cnt) => setUnreadCount(cnt))
        .catch(() => setUnreadCount(0));
    }
  };

  useEffect(() => {
    loadUnreadCount();
    const interval = setInterval(loadUnreadCount, 30000); // Poll unread count every 30s
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggleDropdown = async () => {
    if (!dropdownOpen) {
      try {
        const res = await getNotifications({ size: 5 });
        setRecentNotifications(res.content);
      } catch (err) {
        console.error('Failed to load recent notifications', err);
      }
    }
    setDropdownOpen((prev) => !prev);
  };

  const handleNotificationClick = async (notif: NotificationItem) => {
    if (!notif.isRead) {
      try {
        await markNotificationAsRead(notif.id);
        setUnreadCount((c) => Math.max(0, c - 1));
      } catch (err) {
        console.error('Failed to mark read', err);
      }
    }
    setDropdownOpen(false);
    if (notif.issueId) {
      if (user?.role === 'ROLE_FACULTY' || user?.role === 'ROLE_HOD' || user?.role === 'ROLE_ADMIN') {
        navigate(`/handler/issues/${notif.issueId}`);
      } else {
        navigate(`/student/issues/${notif.issueId}`);
      }
    } else {
      navigate('/notifications');
    }
  };

  const handleQuickMarkAllRead = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await markAllNotificationsAsRead();
      setUnreadCount(0);
      setRecentNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      console.error('Failed to mark all read', err);
    }
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'ROLE_STUDENT':
        return <span className="badge bg-blue-50 text-blue-700 border border-blue-200">Student</span>;
      case 'ROLE_FACULTY':
        return <span className="badge bg-purple-50 text-purple-700 border border-purple-200">Faculty / Handler</span>;
      case 'ROLE_HOD':
        return <span className="badge bg-amber-50 text-amber-700 border border-amber-200">HOD</span>;
      case 'ROLE_ADMIN':
        return <span className="badge bg-emerald-50 text-emerald-700 border border-emerald-200">Administrator</span>;
      default:
        return null;
    }
  };

  const getDashboardLink = (role?: UserRole) => {
    switch (role) {
      case 'ROLE_STUDENT':
        return '/student';
      case 'ROLE_FACULTY':
        return '/handler';
      case 'ROLE_HOD':
        return '/hod';
      case 'ROLE_ADMIN':
        return '/admin';
      default:
        return '/';
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-surface-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo & Brand */}
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-700 to-brand-500 flex items-center justify-center text-white shadow-md shadow-brand-500/20 group-hover:scale-105 transition-transform">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <span className="font-extrabold text-lg tracking-tight text-surface-900 group-hover:text-brand-600 transition-colors">
                CampusCare
              </span>
              <span className="hidden sm:inline-block ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-brand-50 text-brand-700 border border-brand-200">
                v1.0
              </span>
            </div>
          </Link>

          {/* Center Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            <Link
              to="/"
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                location.pathname === '/' ? 'text-brand-600 bg-brand-50' : 'text-surface-600 hover:text-surface-900 hover:bg-surface-100'
              }`}
            >
              Overview
            </Link>
            {isAuthenticated && user && (
              <Link
                to={getDashboardLink(user.role)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  location.pathname.startsWith(getDashboardLink(user.role))
                    ? 'text-brand-600 bg-brand-50 font-semibold'
                    : 'text-surface-600 hover:text-surface-900 hover:bg-surface-100'
                }`}
              >
                My Dashboard
              </Link>
            )}
          </nav>

          {/* Right Section: Health & Notifications & User / Auth */}
          <div className="flex items-center space-x-3">
            {/* Health Status Indicator */}
            <div
              className={`hidden lg:flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                isHealthy === true
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : isHealthy === false
                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                  : 'bg-surface-100 text-surface-600 border-surface-200'
              }`}
            >
              <Activity className={`w-3.5 h-3.5 ${isHealthy ? 'text-emerald-500 animate-pulse' : 'text-surface-400'}`} />
              <span>{isHealthy === true ? 'API Online' : isHealthy === false ? 'API Offline' : 'Connecting...'}</span>
            </div>

            {isAuthenticated && user ? (
              <div className="flex items-center space-x-3">
                {/* Notification Bell Dropdown */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={handleToggleDropdown}
                    className="relative p-2 rounded-xl text-surface-500 hover:text-surface-900 hover:bg-surface-100 transition-colors"
                    title="Notifications"
                  >
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] flex items-center justify-center px-1 text-[10px] font-bold text-white bg-rose-600 rounded-full shadow-sm animate-pulse">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>

                  {/* Dropdown Menu */}
                  {dropdownOpen && (
                    <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-surface-200 overflow-hidden z-50 animate-fadeIn">
                      <div className="p-3.5 border-b border-surface-100 flex items-center justify-between bg-surface-50/70">
                        <div className="flex items-center space-x-1.5">
                          <Bell className="w-4 h-4 text-brand-600" />
                          <span className="text-xs font-bold text-surface-900">Notifications</span>
                          {unreadCount > 0 && (
                            <span className="badge bg-rose-50 text-rose-700 border border-rose-200 text-[10px]">
                              {unreadCount} unread
                            </span>
                          )}
                        </div>

                        {unreadCount > 0 && (
                          <button
                            onClick={handleQuickMarkAllRead}
                            className="text-[11px] text-surface-500 hover:text-brand-600 flex items-center space-x-1"
                          >
                            <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Mark all read</span>
                          </button>
                        )}
                      </div>

                      <div className="divide-y divide-surface-100 max-h-72 overflow-y-auto">
                        {recentNotifications.length === 0 ? (
                          <div className="p-6 text-center text-xs text-surface-400">
                            No notifications at this time
                          </div>
                        ) : (
                          recentNotifications.map((n) => (
                            <div
                              key={n.id}
                              onClick={() => handleNotificationClick(n)}
                              className={`p-3 text-xs cursor-pointer transition-colors ${
                                !n.isRead
                                  ? 'bg-brand-50/40 hover:bg-brand-50/70 border-l-2 border-l-brand-600'
                                  : 'hover:bg-surface-50 border-l-2 border-l-transparent'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-surface-900 truncate max-w-[220px]">
                                  {n.title}
                                </span>
                                <span className="text-[10px] text-surface-400">
                                  {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                              <p className="text-[11px] text-surface-600 mt-1 line-clamp-2">{n.message}</p>
                            </div>
                          ))
                        )}
                      </div>

                      <div className="p-2.5 bg-surface-50 border-t border-surface-100 text-center">
                        <Link
                          to="/notifications"
                          onClick={() => setDropdownOpen(false)}
                          className="text-xs font-semibold text-brand-600 hover:text-brand-800 flex items-center justify-center space-x-1"
                        >
                          <span>View All in Notification Center</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  )}
                </div>

                {/* User info */}
                <div className="hidden sm:flex flex-col items-end">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-surface-800">{user.fullName}</span>
                    {getRoleBadge(user.role)}
                  </div>
                  <span className="text-[10px] text-surface-400 font-mono">{user.email}</span>
                </div>

                <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 font-bold flex items-center justify-center text-xs">
                  <UserIcon className="w-4 h-4" />
                </div>

                <button
                  onClick={logout}
                  title="Sign Out"
                  className="p-1.5 rounded-lg text-surface-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link to="/login" className="btn-secondary !py-1.5 !px-3 text-xs sm:text-sm">
                  <LogIn className="w-4 h-4 mr-1.5" />
                  <span>Sign In</span>
                </Link>
                <Link to="/register" className="btn-primary !py-1.5 !px-3 text-xs sm:text-sm">
                  <UserPlus className="w-4 h-4 mr-1.5" />
                  <span>Register</span>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
