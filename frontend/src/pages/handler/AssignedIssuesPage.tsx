import React, { useEffect, useState, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Search,
  Filter,
  Eye,
  CheckSquare,
  PlayCircle,
  Inbox,
} from 'lucide-react';
import { getAssignedIssues, acknowledgeIssue, startWork } from '../../api/handler';
import type { IssueSummaryResponse, IssueStatus, IssuePriority } from '../../types';

export const AssignedIssuesPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialStatus = (searchParams.get('status') as IssueStatus | null) || '';

  const [issues, setIssues] = useState<IssueSummaryResponse[]>([]);
  const [statusFilter, setStatusFilter] = useState<IssueStatus | ''>(initialStatus);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [actionProcessingId, setActionProcessingId] = useState<number | null>(null);

  const fetchIssues = useCallback(() => {
    setLoading(true);
    getAssignedIssues({
      status: statusFilter,
      search: searchQuery.trim(),
      page,
      size: 10,
    })
      .then((data) => {
        setIssues(data.content);
        setTotalPages(data.totalPages);
        setTotalElements(data.totalElements);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load assigned issues', err);
        setLoading(false);
      });
  }, [statusFilter, searchQuery, page]);

  useEffect(() => {
    fetchIssues();
  }, [fetchIssues]);

  const handleStatusChange = (newStatus: IssueStatus | '') => {
    setStatusFilter(newStatus);
    setPage(0);
    if (newStatus) {
      setSearchParams({ status: newStatus });
    } else {
      setSearchParams({});
    }
  };

  const handleQuickAcknowledge = async (id: number) => {
    setActionProcessingId(id);
    try {
      await acknowledgeIssue(id);
      fetchIssues();
    } catch (err) {
      console.error('Failed to acknowledge issue', err);
    } finally {
      setActionProcessingId(null);
    }
  };

  const handleQuickStart = async (id: number) => {
    setActionProcessingId(id);
    try {
      await startWork(id);
      fetchIssues();
    } catch (err) {
      console.error('Failed to start work', err);
    } finally {
      setActionProcessingId(null);
    }
  };

  const getStatusBadge = (status: IssueStatus) => {
    switch (status) {
      case 'ASSIGNED':
        return <span className="badge bg-purple-50 text-purple-700 border border-purple-200">Assigned</span>;
      case 'ACKNOWLEDGED':
        return <span className="badge bg-indigo-50 text-indigo-700 border border-indigo-200">Acknowledged</span>;
      case 'IN_PROGRESS':
        return <span className="badge bg-amber-50 text-amber-700 border border-amber-200">In Progress</span>;
      case 'RESOLVED':
        return <span className="badge bg-emerald-50 text-emerald-700 border border-emerald-200">Resolved</span>;
      case 'CLOSED':
        return <span className="badge bg-slate-100 text-slate-700 border border-slate-300">Closed</span>;
      case 'REOPENED':
        return <span className="badge bg-orange-50 text-orange-700 border border-orange-200">Reopened</span>;
      case 'REJECTED':
        return <span className="badge bg-rose-50 text-rose-700 border border-rose-200">Rejected</span>;
      default:
        return <span className="badge bg-surface-100 text-surface-700">{status}</span>;
    }
  };

  const getPriorityBadge = (priority: IssuePriority) => {
    switch (priority) {
      case 'CRITICAL':
        return <span className="text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded">CRITICAL</span>;
      case 'HIGH':
        return <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">HIGH</span>;
      case 'MEDIUM':
        return <span className="text-[10px] font-semibold text-yellow-700 bg-yellow-50 border border-yellow-200 px-2 py-0.5 rounded">MEDIUM</span>;
      default:
        return <span className="text-[10px] text-surface-600 bg-surface-100 border border-surface-200 px-2 py-0.5 rounded">LOW</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Assigned Issues Queue</h1>
          <p className="text-xs text-surface-500">
            Issues routed to your coordination portfolio ({totalElements} total)
          </p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="card-premium p-4 space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
            <input
              type="text"
              placeholder="Search by Public ID, title, or location..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(0);
              }}
              className="input-field !pl-9 text-xs"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-surface-400 shrink-0" />
            <span className="text-xs text-surface-500 font-medium">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => handleStatusChange(e.target.value as IssueStatus | '')}
              className="input-field text-xs !py-1.5"
            >
              <option value="">All Statuses</option>
              <option value="ASSIGNED">Assigned (Needs Ack)</option>
              <option value="ACKNOWLEDGED">Acknowledged</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="RESOLVED">Resolved</option>
              <option value="CLOSED">Closed</option>
              <option value="REOPENED">Reopened</option>
            </select>
          </div>
        </div>

        {/* Quick Filter Pills */}
        <div className="flex flex-wrap gap-1.5 pt-1 border-t border-surface-100">
          <button
            onClick={() => handleStatusChange('')}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
              statusFilter === ''
                ? 'bg-surface-900 text-white'
                : 'bg-surface-100 text-surface-600 hover:bg-surface-200'
            }`}
          >
            All Issues
          </button>
          <button
            onClick={() => handleStatusChange('ASSIGNED')}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
              statusFilter === 'ASSIGNED'
                ? 'bg-purple-600 text-white'
                : 'bg-purple-50 text-purple-700 hover:bg-purple-100'
            }`}
          >
            Assigned
          </button>
          <button
            onClick={() => handleStatusChange('ACKNOWLEDGED')}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
              statusFilter === 'ACKNOWLEDGED'
                ? 'bg-indigo-600 text-white'
                : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
            }`}
          >
            Acknowledged
          </button>
          <button
            onClick={() => handleStatusChange('IN_PROGRESS')}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
              statusFilter === 'IN_PROGRESS'
                ? 'bg-amber-600 text-white'
                : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
            }`}
          >
            In Progress
          </button>
          <button
            onClick={() => handleStatusChange('RESOLVED')}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
              statusFilter === 'RESOLVED'
                ? 'bg-emerald-600 text-white'
                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
            }`}
          >
            Resolved
          </button>
          <button
            onClick={() => handleStatusChange('REOPENED')}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
              statusFilter === 'REOPENED'
                ? 'bg-orange-600 text-white'
                : 'bg-orange-50 text-orange-700 hover:bg-orange-100'
            }`}
          >
            Reopened
          </button>
        </div>
      </div>

      {/* Issues Table */}
      <div className="card-premium overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-50 border-b border-surface-200 text-surface-600 uppercase font-semibold">
              <tr>
                <th className="px-4 py-3">Issue ID</th>
                <th className="px-4 py-3">Title & Category</th>
                <th className="px-4 py-3">Location</th>
                <th className="px-4 py-3">Priority</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Reported</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-surface-400">
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-4 h-4 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
                      <span>Loading assigned issues...</span>
                    </div>
                  </td>
                </tr>
              ) : issues.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-surface-400">
                    <Inbox className="w-8 h-8 mx-auto mb-2 text-surface-300" />
                    <p className="font-medium text-surface-600">No issues found matching this filter</p>
                    <p className="text-[11px] text-surface-400 mt-0.5">Try adjusting status or search terms</p>
                  </td>
                </tr>
              ) : (
                issues.map((issue) => (
                  <tr key={issue.id} className="hover:bg-surface-50/70 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-surface-900 whitespace-nowrap">
                      <Link
                        to={`/handler/issues/${issue.id}`}
                        className="text-brand-600 hover:text-brand-800 hover:underline"
                      >
                        {issue.publicIssueId}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-surface-900 max-w-xs truncate">{issue.title}</div>
                      <div className="text-[11px] text-surface-400">{issue.categoryName}</div>
                    </td>
                    <td className="px-4 py-3 text-surface-600 whitespace-nowrap">{issue.location}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{getPriorityBadge(issue.priority)}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{getStatusBadge(issue.status)}</td>
                    <td className="px-4 py-3 text-surface-500 whitespace-nowrap">
                      {new Date(issue.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end space-x-1.5">
                        {issue.status === 'ASSIGNED' && (
                          <button
                            onClick={() => handleQuickAcknowledge(issue.id)}
                            disabled={actionProcessingId === issue.id}
                            className="btn-secondary !py-1 !px-2 text-[11px] bg-purple-50 text-purple-700 hover:bg-purple-100 border-purple-200 flex items-center space-x-1"
                            title="Acknowledge issue"
                          >
                            <CheckSquare className="w-3 h-3" />
                            <span>Ack</span>
                          </button>
                        )}
                        {(issue.status === 'ACKNOWLEDGED' || issue.status === 'REOPENED') && (
                          <button
                            onClick={() => handleQuickStart(issue.id)}
                            disabled={actionProcessingId === issue.id}
                            className="btn-secondary !py-1 !px-2 text-[11px] bg-amber-50 text-amber-700 hover:bg-amber-100 border-amber-200 flex items-center space-x-1"
                            title="Start Remediation"
                          >
                            <PlayCircle className="w-3 h-3" />
                            <span>Start</span>
                          </button>
                        )}
                        <Link
                          to={`/handler/issues/${issue.id}`}
                          className="btn-secondary !py-1 !px-2.5 text-[11px] flex items-center space-x-1"
                        >
                          <Eye className="w-3 h-3" />
                          <span>View</span>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-surface-200 flex items-center justify-between text-xs text-surface-500">
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
    </div>
  );
};
