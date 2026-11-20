import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  CheckCheck,
  Inbox,
  CheckCircle2,
  PlayCircle,
  MessageSquare,
  AlertTriangle,
  RotateCcw,
  Clock,
  ArrowRight,
  Filter,
} from 'lucide-react';
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from '../api/notification';
import { useAuth } from '../context/AuthContext';
import type { NotificationItem } from '../types';

export const NotificationsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [markingAll, setMarkingAll] = useState(false);

  const fetchList = useCallback(() => {
    setLoading(true);
    getNotifications({ unreadOnly, page, size: 10 })
      .then((res) => {
        setNotifications(res.content);
        setTotalPages(res.totalPages);
        setTotalElements(res.totalElements);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load notifications', err);
        setLoading(false);
      });
  }, [unreadOnly, page]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const handleMarkAsRead = async (id: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      await markNotificationAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
    } catch (err) {
      console.error('Failed to mark notification as read', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    setMarkingAll(true);
    try {
      await markAllNotificationsAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      console.error('Failed to mark all as read', err);
    } finally {
      setMarkingAll(false);
    }
  };

  const handleNotificationClick = async (notif: NotificationItem) => {
    if (!notif.isRead) {
      await handleMarkAsRead(notif.id);
    }
    if (notif.issueId) {
      if (user?.role === 'ROLE_FACULTY' || user?.role === 'ROLE_HOD' || user?.role === 'ROLE_ADMIN') {
        navigate(`/handler/issues/${notif.issueId}`);
      } else {
        navigate(`/student/issues/${notif.issueId}`);
      }
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'ISSUE_SUBMITTED':
      case 'ISSUE_ASSIGNED':
        return <Inbox className="w-4 h-4 text-purple-600" />;
      case 'ISSUE_ACKNOWLEDGED':
        return <Clock className="w-4 h-4 text-indigo-600" />;
      case 'ISSUE_IN_PROGRESS':
        return <PlayCircle className="w-4 h-4 text-amber-600" />;
      case 'ISSUE_RESOLVED':
        return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
      case 'ISSUE_CLOSED':
        return <CheckCircle2 className="w-4 h-4 text-slate-600" />;
      case 'ISSUE_REOPENED':
        return <RotateCcw className="w-4 h-4 text-orange-600" />;
      case 'NEW_COMMENT':
        return <MessageSquare className="w-4 h-4 text-blue-600" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-surface-500" />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 flex items-center space-x-2">
            <Bell className="w-6 h-6 text-brand-600" />
            <span>Notification Center</span>
          </h1>
          <p className="text-xs text-surface-500">
            Real-time campus issue alerts, status transitions, and coordinator messages ({totalElements} total)
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleMarkAllAsRead}
            disabled={markingAll || notifications.every((n) => n.isRead)}
            className="btn-secondary !py-2 text-xs flex items-center space-x-1.5 disabled:opacity-40"
          >
            <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>{markingAll ? 'Updating...' : 'Mark All as Read'}</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center space-x-2 border-b border-surface-200 pb-2">
        <Filter className="w-4 h-4 text-surface-400 mr-1" />
        <button
          onClick={() => {
            setUnreadOnly(false);
            setPage(0);
          }}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            !unreadOnly
              ? 'bg-brand-50 text-brand-700 border border-brand-200'
              : 'text-surface-600 hover:text-surface-900 hover:bg-surface-100'
          }`}
        >
          All Notifications
        </button>
        <button
          onClick={() => {
            setUnreadOnly(true);
            setPage(0);
          }}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            unreadOnly
              ? 'bg-brand-50 text-brand-700 border border-brand-200'
              : 'text-surface-600 hover:text-surface-900 hover:bg-surface-100'
          }`}
        >
          Unread Only
        </button>
      </div>

      {/* Notification List */}
      <div className="card-premium overflow-hidden divide-y divide-surface-100">
        {loading ? (
          <div className="p-12 text-center text-surface-400">
            <div className="w-5 h-5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs">Loading notifications...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-12 text-center text-surface-400 space-y-2">
            <Bell className="w-8 h-8 mx-auto text-surface-300 stroke-1" />
            <p className="text-xs font-medium text-surface-700">No notifications to display</p>
            <p className="text-[11px] text-surface-400">
              {unreadOnly ? 'You have read all your notifications!' : 'You have no alerts at this time.'}
            </p>
          </div>
        ) : (
          notifications.map((notif) => (
            <div
              key={notif.id}
              onClick={() => handleNotificationClick(notif)}
              className={`p-4 transition-colors cursor-pointer flex flex-col sm:flex-row sm:items-start justify-between gap-3 ${
                !notif.isRead
                  ? 'bg-brand-50/30 hover:bg-brand-50/60 border-l-4 border-l-brand-600'
                  : 'hover:bg-surface-50 border-l-4 border-l-transparent'
              }`}
            >
              <div className="flex items-start space-x-3 flex-1">
                <div className="p-2 rounded-lg bg-surface-100 shrink-0 mt-0.5">
                  {getTypeIcon(notif.notificationType)}
                </div>

                <div className="space-y-1 flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-surface-900">{notif.title}</span>
                    {!notif.isRead && (
                      <span className="w-2 h-2 rounded-full bg-brand-600 inline-block" />
                    )}
                    {notif.publicIssueId && (
                      <span className="font-mono text-[10px] bg-surface-100 text-surface-700 px-1.5 py-0.2 rounded border border-surface-200">
                        {notif.publicIssueId}
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-surface-600 leading-relaxed">{notif.message}</p>

                  <div className="text-[11px] text-surface-400">
                    {new Date(notif.createdAt).toLocaleString([], {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2 self-end sm:self-center shrink-0">
                {!notif.isRead && (
                  <button
                    onClick={(e) => handleMarkAsRead(notif.id, e)}
                    className="text-[11px] font-medium text-brand-600 hover:text-brand-800 hover:underline px-2 py-1"
                  >
                    Mark as read
                  </button>
                )}
                {notif.issueId && (
                  <span className="btn-secondary !py-1 !px-2.5 text-xs inline-flex items-center space-x-1">
                    <span>Inspect</span>
                    <ArrowRight className="w-3 h-3 text-surface-400" />
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination Bar */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-surface-500 pt-2">
          <span>
            Page {page + 1} of {totalPages}
          </span>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="btn-secondary !py-1 !px-2.5 text-xs disabled:opacity-40"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="btn-secondary !py-1 !px-2.5 text-xs disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
