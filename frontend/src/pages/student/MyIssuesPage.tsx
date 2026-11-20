import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  FilePlus,
  ArrowRight,
  MapPin,
  Clock,
  Inbox,
} from 'lucide-react';
import { getMyIssues } from '../../api/issue';
import type { IssueSummaryResponse, IssueStatus, IssuePriority } from '../../types';

export const MyIssuesPage: React.FC = () => {
  const [issues, setIssues] = useState<IssueSummaryResponse[]>([]);
  const [statusFilter, setStatusFilter] = useState<IssueStatus | ''>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [totalElements, setTotalElements] = useState(0);
  const [page, setPage] = useState(0);

  const fetchIssues = useCallback(() => {
    setLoading(true);
    getMyIssues({
      status: statusFilter,
      search: searchQuery,
      page,
      size: 10,
    })
      .then((res) => {
        setIssues(res.content);
        setTotalElements(res.totalElements);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, [statusFilter, searchQuery, page]);

  useEffect(() => {
    fetchIssues();
  }, [fetchIssues]);

  const getStatusBadge = (status: IssueStatus) => {
    switch (status) {
      case 'SUBMITTED':
        return <span className="badge bg-blue-50 text-blue-700 border border-blue-200">Submitted</span>;
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
      case 'UNASSIGNED':
        return <span className="badge bg-slate-50 text-slate-600 border border-slate-200">Unassigned</span>;
      default:
        return <span className="badge bg-surface-100 text-surface-700">{status}</span>;
    }
  };

  const getPriorityBadge = (priority: IssuePriority) => {
    switch (priority) {
      case 'CRITICAL':
        return <span className="text-[10px] font-bold text-red-600 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded">CRITICAL</span>;
      case 'HIGH':
        return <span className="text-[10px] font-bold text-orange-600 bg-orange-50 border border-orange-200 px-1.5 py-0.5 rounded">HIGH</span>;
      case 'MEDIUM':
        return <span className="text-[10px] font-semibold text-yellow-700 bg-yellow-50 border border-yellow-200 px-1.5 py-0.5 rounded">MEDIUM</span>;
      case 'LOW':
        return <span className="text-[10px] font-semibold text-blue-600 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded">LOW</span>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 tracking-tight">My Reported Issues</h1>
          <p className="text-xs text-surface-500 mt-1">
            Track real-time progress and handler actions across all your submitted issues
          </p>
        </div>
        <Link to="/student/report" className="btn-primary text-xs !py-2 self-start sm:self-auto">
          <FilePlus className="w-4 h-4 mr-1.5" />
          <span>Report New Issue</span>
        </Link>
      </div>

      {/* Filters and Search Bar */}
      <div className="card-premium p-4 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="flex flex-wrap gap-1.5">
          {[
            { label: 'All', value: '' },
            { label: 'Submitted', value: 'SUBMITTED' },
            { label: 'In Progress', value: 'IN_PROGRESS' },
            { label: 'Resolved', value: 'RESOLVED' },
            { label: 'Closed', value: 'CLOSED' },
          ].map((tab) => (
            <button
              key={tab.label}
              onClick={() => {
                setStatusFilter(tab.value as IssueStatus | '');
                setPage(0);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                statusFilter === tab.value
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'text-surface-600 hover:bg-surface-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative min-w-[260px]">
          <Search className="w-4 h-4 text-surface-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(0);
            }}
            placeholder="Search by title, ID, or location..."
            className="input-field !pl-9 text-xs !py-2"
          />
        </div>
      </div>

      {/* Issues Table Card */}
      <div className="card-premium overflow-hidden">
        {loading ? (
          <div className="py-16 text-center">
            <div className="w-8 h-8 border-3 border-brand-200 border-t-brand-600 rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs text-surface-500">Loading your issues...</p>
          </div>
        ) : issues.length === 0 ? (
          <div className="py-16 text-center px-4">
            <div className="w-12 h-12 rounded-full bg-surface-100 text-surface-400 flex items-center justify-center mx-auto mb-3">
              <Inbox className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-surface-800">No issues found</h3>
            <p className="text-xs text-surface-500 max-w-sm mx-auto mt-1">
              {searchQuery || statusFilter
                ? 'No issues match the selected search or status filter.'
                : "You haven't reported any issues yet. Click 'Report New Issue' to get started."}
            </p>
            {!searchQuery && !statusFilter && (
              <div className="mt-4">
                <Link to="/student/report" className="btn-primary text-xs">
                  <FilePlus className="w-4 h-4 mr-1.5" />
                  <span>Report an Issue</span>
                </Link>
              </div>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-50 border-b border-surface-200 text-surface-500 uppercase tracking-wider text-[10px] font-semibold">
                <tr>
                  <th className="px-5 py-3.5">Issue ID</th>
                  <th className="px-5 py-3.5">Title & Category</th>
                  <th className="px-5 py-3.5">Location</th>
                  <th className="px-5 py-3.5">Priority</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Reported</th>
                  <th className="px-5 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100">
                {issues.map((issue) => (
                  <tr key={issue.id} className="hover:bg-surface-50/70 transition-colors">
                    <td className="px-5 py-4 font-mono font-bold text-brand-700 whitespace-nowrap">
                      {issue.publicIssueId}
                    </td>
                    <td className="px-5 py-4">
                      <div className="font-semibold text-surface-900 line-clamp-1">{issue.title}</div>
                      <div className="text-[11px] text-surface-400 mt-0.5">{issue.categoryName}</div>
                    </td>
                    <td className="px-5 py-4 text-surface-600 whitespace-nowrap">
                      <div className="flex items-center space-x-1">
                        <MapPin className="w-3.5 h-3.5 text-surface-400" />
                        <span>{issue.location}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      {getPriorityBadge(issue.priority)}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      {getStatusBadge(issue.status)}
                    </td>
                    <td className="px-5 py-4 text-surface-400 whitespace-nowrap">
                      <div className="flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>{new Date(issue.createdAt).toLocaleDateString()}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-right whitespace-nowrap">
                      <Link
                        to={`/student/issues/${issue.id}`}
                        className="inline-flex items-center space-x-1 text-brand-600 hover:text-brand-800 font-semibold text-xs"
                      >
                        <span>Details</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer pagination info */}
        <div className="px-5 py-3 bg-surface-50 border-t border-surface-200 flex items-center justify-between text-xs text-surface-500">
          <span>Showing {issues.length} of {totalElements} issues</span>
        </div>
      </div>
    </div>
  );
};
