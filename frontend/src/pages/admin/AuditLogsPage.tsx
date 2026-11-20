import React, { useEffect, useState, useCallback } from 'react';
import {
  Layers,
  RefreshCw,
  Search,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Shield,
  ArrowRight,
} from 'lucide-react';
import { getAuditLogs } from '../../api/admin';
import type { AdminAuditLogDto } from '../../types';

export const AuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<AdminAuditLogDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);

  // Filters
  const [eventType, setEventType] = useState<string>('');
  const [issueId, setIssueId] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const loadLogs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAuditLogs({
        eventType: eventType || undefined,
        issueId: issueId ? Number(issueId) : undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        page,
        size: 15,
      });
      setLogs(res.content);
      setTotalPages(res.totalPages);
      setTotalElements(res.totalElements);
    } catch (err) {
      console.error('Failed to load audit logs', err);
    } finally {
      setLoading(false);
    }
  }, [eventType, issueId, startDate, endDate, page]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const getEventBadge = (type: string) => {
    switch (type) {
      case 'STATUS_CHANGED':
        return <span className="badge bg-blue-50 text-blue-700 border border-blue-200">Status Changed</span>;
      case 'REASSIGNED':
        return <span className="badge bg-purple-50 text-purple-700 border border-purple-200">Reassigned</span>;
      case 'RESOLVED':
        return <span className="badge bg-emerald-50 text-emerald-700 border border-emerald-200">Resolved</span>;
      case 'REOPENED':
        return <span className="badge bg-rose-50 text-rose-700 border border-rose-200">Reopened</span>;
      case 'ESCALATED':
        return <span className="badge bg-amber-50 text-amber-800 border border-amber-200">SLA Escalated</span>;
      case 'COMMENT_ADDED':
        return <span className="badge bg-surface-100 text-surface-700 border border-surface-200">Note / Comment</span>;
      default:
        return <span className="badge">{type}</span>;
    }
  };

  const formatDate = (isoStr: string) => {
    const d = new Date(isoStr);
    return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-surface-200 pb-5">
        <div>
          <div className="flex items-center space-x-2">
            <span className="badge bg-surface-100 text-surface-700 border border-surface-200 text-xs">
              Audit Compliance
            </span>
            <span className="text-surface-400 text-xs">• {totalElements} Events Recorded</span>
          </div>
          <h1 className="text-2xl font-bold text-surface-900 tracking-tight mt-1 flex items-center space-x-2">
            <Layers className="w-6 h-6 text-brand-600" />
            <span>Institutional Audit Event Trail</span>
          </h1>
          <p className="text-sm text-surface-500 mt-1">
            Immutable system logs tracking issue lifecycle transitions, faculty reassignments, supervisor rejections, and SLA breaches.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={loadLogs}
            disabled={loading}
            className="btn btn-secondary flex items-center space-x-2 text-sm"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="card p-4 bg-white border border-surface-200 rounded-xl shadow-sm grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 items-end">
        <div>
          <label className="block text-xs font-semibold text-surface-700 mb-1">Event Type</label>
          <select
            value={eventType}
            onChange={(e) => {
              setEventType(e.target.value);
              setPage(0);
            }}
            className="input text-xs py-2 w-full"
          >
            <option value="">All Events</option>
            <option value="STATUS_CHANGED">Status Changed</option>
            <option value="REASSIGNED">Reassigned</option>
            <option value="RESOLVED">Resolved</option>
            <option value="REOPENED">Reopened</option>
            <option value="ESCALATED">SLA Escalated</option>
            <option value="COMMENT_ADDED">Comment / Note</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-surface-700 mb-1">Issue Database ID</label>
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-surface-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="number"
              placeholder="e.g. 1"
              value={issueId}
              onChange={(e) => {
                setIssueId(e.target.value);
                setPage(0);
              }}
              className="input pl-8 text-xs py-2 w-full"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-surface-700 mb-1 flex items-center space-x-1">
            <Calendar className="w-3 h-3 text-surface-400" />
            <span>Start Date</span>
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value);
              setPage(0);
            }}
            className="input text-xs py-2 w-full"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-surface-700 mb-1 flex items-center space-x-1">
            <Calendar className="w-3 h-3 text-surface-400" />
            <span>End Date</span>
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => {
              setEndDate(e.target.value);
              setPage(0);
            }}
            className="input text-xs py-2 w-full"
          />
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="card bg-white border border-surface-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-50 border-b border-surface-200 text-xs font-semibold text-surface-600">
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Event</th>
                <th className="py-3 px-4">Ticket</th>
                <th className="py-3 px-4">Actor</th>
                <th className="py-3 px-4">Transition Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-surface-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-brand-600" />
                    <span>Loading audit records...</span>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-surface-400">
                    No audit records found matching your filter criteria.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-surface-50 transition-colors">
                    <td className="py-3 px-4 text-xs font-mono text-surface-500 whitespace-nowrap">
                      {formatDate(log.createdAt)}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">{getEventBadge(log.eventType)}</td>
                    <td className="py-3 px-4">
                      <div className="font-mono text-xs font-bold text-brand-600">
                        {log.publicIssueId || `Issue #${log.issueId}`}
                      </div>
                      <div className="text-xs text-surface-600 truncate max-w-xs" title={log.issueTitle}>
                        {log.issueTitle}
                      </div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="font-semibold text-xs text-surface-900 flex items-center space-x-1.5">
                        <Shield className="w-3.5 h-3.5 text-surface-400" />
                        <span>{log.actorName}</span>
                      </div>
                      <div className="text-[11px] text-surface-400">{log.actorEmail}</div>
                    </td>
                    <td className="py-3 px-4 text-xs text-surface-700">
                      {log.oldStatus && log.newStatus && (
                        <div className="flex items-center space-x-1 font-mono text-[11px]">
                          <span className="text-surface-500">{log.oldStatus}</span>
                          <ArrowRight className="w-3 h-3 text-surface-400" />
                          <span className="font-bold text-brand-700">{log.newStatus}</span>
                        </div>
                      )}
                      {log.previousAssigneeName && log.newAssigneeName && (
                        <div className="text-[11px] text-purple-700 mt-0.5">
                          Assigned: {log.previousAssigneeName} → <strong>{log.newAssigneeName}</strong>
                        </div>
                      )}
                      {log.comment && (
                        <p className="text-[11px] text-surface-500 italic mt-0.5 line-clamp-2" title={log.comment}>
                          "{log.comment}"
                        </p>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="p-4 bg-surface-50 border-t border-surface-200 flex items-center justify-between text-xs text-surface-600">
            <span>
              Showing Page {page + 1} of {totalPages} ({totalElements} events)
            </span>
            <div className="flex items-center space-x-1">
              <button
                disabled={page === 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                className="btn btn-secondary !py-1 !px-2 text-xs flex items-center space-x-1 disabled:opacity-40"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Prev</span>
              </button>
              <button
                disabled={page >= totalPages - 1}
                onClick={() => setPage((p) => p + 1)}
                className="btn btn-secondary !py-1 !px-2 text-xs flex items-center space-x-1 disabled:opacity-40"
              >
                <span>Next</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
export default AuditLogsPage;
