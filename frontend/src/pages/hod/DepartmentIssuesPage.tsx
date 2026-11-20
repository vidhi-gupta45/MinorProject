import React, { useEffect, useState, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Search,
  Filter,
  Eye,
  UserCheck,
  Ban,
  X,
  Inbox,
  Layers,
  CheckCircle2,
} from 'lucide-react';
import {
  getDepartmentIssues,
  reassignIssue,
  rejectIssue,
  getDepartmentHandlers,
} from '../../api/hod';
import { getCategories } from '../../api/issue';
import type {
  IssueSummaryResponse,
  CategoryDto,
  User,
  IssueStatus,
  IssuePriority,
} from '../../types';

export const DepartmentIssuesPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialOverdue = searchParams.get('overdue') === 'true';
  const initialStatus = (searchParams.get('status') as IssueStatus | null) || '';

  const [issues, setIssues] = useState<IssueSummaryResponse[]>([]);
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [handlers, setHandlers] = useState<User[]>([]);

  // Filter states
  const [statusFilter, setStatusFilter] = useState<IssueStatus | ''>(initialStatus);
  const [categoryFilter, setCategoryFilter] = useState<number | ''>('');
  const [handlerFilter, setHandlerFilter] = useState<number | ''>('');
  const [overdueOnly, setOverdueOnly] = useState<boolean>(initialOverdue);
  const [searchQuery, setSearchQuery] = useState('');

  // Pagination
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(true);

  // Reassignment Modal State
  const [reassignModalIssue, setReassignModalIssue] = useState<IssueSummaryResponse | null>(null);
  const [selectedHandlerId, setSelectedHandlerId] = useState<number | ''>('');
  const [reassignReason, setReassignReason] = useState('');
  const [submittingReassign, setSubmittingReassign] = useState(false);
  const [reassignError, setReassignError] = useState<string | null>(null);

  // Rejection Modal State
  const [rejectModalIssue, setRejectModalIssue] = useState<IssueSummaryResponse | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [submittingReject, setSubmittingReject] = useState(false);
  const [rejectError, setRejectError] = useState<string | null>(null);

  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Load auxiliary data
  useEffect(() => {
    getCategories().then(setCategories).catch(console.error);
    getDepartmentHandlers().then(setHandlers).catch(console.error);
  }, []);

  const fetchIssues = useCallback(() => {
    setLoading(true);
    getDepartmentIssues({
      status: statusFilter,
      categoryId: categoryFilter,
      handlerId: handlerFilter,
      overdueOnly,
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
        console.error('Failed to load department issues', err);
        setLoading(false);
      });
  }, [statusFilter, categoryFilter, handlerFilter, overdueOnly, searchQuery, page]);

  useEffect(() => {
    fetchIssues();
  }, [fetchIssues]);

  const handleReassignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reassignModalIssue || !selectedHandlerId || !reassignReason.trim()) return;

    setSubmittingReassign(true);
    setReassignError(null);
    try {
      await reassignIssue(reassignModalIssue.id, Number(selectedHandlerId), reassignReason.trim());
      setActionSuccess(`Issue ${reassignModalIssue.publicIssueId} reassigned successfully.`);
      setReassignModalIssue(null);
      setSelectedHandlerId('');
      setReassignReason('');
      fetchIssues();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Failed to reassign issue.';
      setReassignError(msg);
    } finally {
      setSubmittingReassign(false);
    }
  };

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectModalIssue || !rejectReason.trim()) return;

    setSubmittingReject(true);
    setRejectError(null);
    try {
      await rejectIssue(rejectModalIssue.id, rejectReason.trim());
      setActionSuccess(`Issue ${rejectModalIssue.publicIssueId} has been rejected.`);
      setRejectModalIssue(null);
      setRejectReason('');
      fetchIssues();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Failed to reject issue.';
      setRejectError(msg);
    } finally {
      setSubmittingReject(false);
    }
  };

  const getStatusBadge = (status: IssueStatus) => {
    switch (status) {
      case 'SUBMITTED':
        return <span className="badge bg-blue-50 text-blue-700 border border-blue-200">Submitted</span>;
      case 'UNASSIGNED':
        return <span className="badge bg-purple-50 text-purple-700 border border-purple-200">Unassigned</span>;
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
          <h1 className="text-2xl font-bold text-surface-900 flex items-center space-x-2">
            <Layers className="w-6 h-6 text-brand-600" />
            <span>Department Issues Oversight</span>
          </h1>
          <p className="text-xs text-surface-500">
            Monitor and manage all issues across department categories ({totalElements} total)
          </p>
        </div>
      </div>

      {actionSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between animate-fadeIn">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-medium">{actionSuccess}</span>
          </div>
          <button
            onClick={() => setActionSuccess(null)}
            className="text-emerald-700 hover:text-emerald-900 font-bold ml-2"
          >
            &times;
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
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

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center space-x-1.5">
              <Filter className="w-3.5 h-3.5 text-surface-400" />
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value as IssueStatus | '');
                  setPage(0);
                }}
                className="input-field text-xs !py-1.5"
              >
                <option value="">All Statuses</option>
                <option value="UNASSIGNED">Unassigned</option>
                <option value="ASSIGNED">Assigned</option>
                <option value="ACKNOWLEDGED">Acknowledged</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="RESOLVED">Resolved</option>
                <option value="CLOSED">Closed</option>
                <option value="REOPENED">Reopened</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>

            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value ? Number(e.target.value) : '');
                setPage(0);
              }}
              className="input-field text-xs !py-1.5"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            <select
              value={handlerFilter}
              onChange={(e) => {
                setHandlerFilter(e.target.value ? Number(e.target.value) : '');
                setPage(0);
              }}
              className="input-field text-xs !py-1.5"
            >
              <option value="">All Handlers</option>
              {handlers.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.fullName}
                </option>
              ))}
            </select>

            <label className="flex items-center space-x-1.5 text-xs text-surface-700 font-medium px-2 py-1 rounded bg-surface-100 hover:bg-surface-200 cursor-pointer">
              <input
                type="checkbox"
                checked={overdueOnly}
                onChange={(e) => {
                  setOverdueOnly(e.target.checked);
                  setPage(0);
                }}
                className="rounded border-surface-300 text-rose-600 focus:ring-rose-500"
              />
              <span className="text-rose-700 font-semibold">Overdue Only</span>
            </label>
          </div>
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
                <th className="px-4 py-3">Handler</th>
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
                  <td colSpan={8} className="px-4 py-12 text-center text-surface-400">
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-4 h-4 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
                      <span>Loading department issues...</span>
                    </div>
                  </td>
                </tr>
              ) : issues.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-surface-400">
                    <Inbox className="w-8 h-8 mx-auto mb-2 text-surface-300" />
                    <p className="font-medium text-surface-600">No issues found matching these filters</p>
                    <p className="text-[11px] text-surface-400 mt-0.5">Try resetting status or search keywords</p>
                  </td>
                </tr>
              ) : (
                issues.map((issue) => (
                  <tr key={issue.id} className="hover:bg-surface-50/70 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold whitespace-nowrap">
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
                    <td className="px-4 py-3 whitespace-nowrap">
                      {issue.assignedHandlerName ? (
                        <span className="font-medium text-surface-800">{issue.assignedHandlerName}</span>
                      ) : (
                        <span className="badge bg-purple-50 text-purple-700 border border-purple-200 text-[10px]">
                          Unassigned
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-surface-600 whitespace-nowrap">{issue.location}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{getPriorityBadge(issue.priority)}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{getStatusBadge(issue.status)}</td>
                    <td className="px-4 py-3 text-surface-500 whitespace-nowrap">
                      {new Date(issue.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end space-x-1.5">
                        <Link
                          to={`/handler/issues/${issue.id}`}
                          className="btn-secondary !py-1 !px-2 text-[11px] flex items-center space-x-1"
                          title="Inspect full details, internal notes & history"
                        >
                          <Eye className="w-3 h-3" />
                          <span>Inspect</span>
                        </Link>

                        {issue.status !== 'CLOSED' && issue.status !== 'REJECTED' && (
                          <>
                            <button
                              onClick={() => {
                                setReassignModalIssue(issue);
                                setSelectedHandlerId('');
                                setReassignReason('');
                                setReassignError(null);
                              }}
                              className="btn-secondary !py-1 !px-2 text-[11px] bg-purple-50 text-purple-700 hover:bg-purple-100 border-purple-200 flex items-center space-x-1"
                              title="Reassign to another handler"
                            >
                              <UserCheck className="w-3 h-3" />
                              <span>Reassign</span>
                            </button>

                            {issue.status !== 'RESOLVED' && (
                              <button
                                onClick={() => {
                                  setRejectModalIssue(issue);
                                  setRejectReason('');
                                  setRejectError(null);
                                }}
                                className="btn-secondary !py-1 !px-2 text-[11px] bg-rose-50 text-rose-700 hover:bg-rose-100 border-rose-200 flex items-center space-x-1"
                                title="Reject frivolous/invalid issue"
                              >
                                <Ban className="w-3 h-3" />
                                <span>Reject</span>
                              </button>
                            )}
                          </>
                        )}
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

      {/* Reassign Modal */}
      {reassignModalIssue && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface-950/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-surface-200">
            <div className="flex items-center justify-between border-b border-surface-100 pb-3">
              <div className="flex items-center space-x-2">
                <UserCheck className="w-5 h-5 text-purple-600" />
                <h3 className="text-base font-bold text-surface-900">Reassign Issue</h3>
              </div>
              <button
                onClick={() => setReassignModalIssue(null)}
                className="text-surface-400 hover:text-surface-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs bg-surface-50 p-3 rounded-lg border border-surface-200 space-y-1">
              <div className="font-mono font-bold text-surface-800">{reassignModalIssue.publicIssueId}</div>
              <div className="font-medium text-surface-900">{reassignModalIssue.title}</div>
              <div className="text-surface-500">Current Assignee: {reassignModalIssue.assignedHandlerName || 'Unassigned'}</div>
            </div>

            {reassignError && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                {reassignError}
              </div>
            )}

            <form onSubmit={handleReassignSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-surface-700">
                  Select New Coordinator <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={selectedHandlerId}
                  onChange={(e) => setSelectedHandlerId(e.target.value ? Number(e.target.value) : '')}
                  className="input-field text-xs w-full"
                >
                  <option value="">-- Choose Faculty Handler --</option>
                  {handlers.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.fullName} ({h.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-surface-700">
                  Reason for Reassignment <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  value={reassignReason}
                  onChange={(e) => setReassignReason(e.target.value)}
                  placeholder="Explain why this issue is being reassigned (e.g., 'Workload rebalancing' or 'Specialized hardware expertise required')..."
                  className="input-field text-xs w-full"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-surface-100">
                <button
                  type="button"
                  onClick={() => setReassignModalIssue(null)}
                  className="btn-secondary !py-2 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReassign || !selectedHandlerId || !reassignReason.trim()}
                  className="btn-primary !py-2 text-xs bg-purple-600 hover:bg-purple-700 text-white"
                >
                  <UserCheck className="w-3.5 h-3.5 mr-1.5" />
                  <span>{submittingReassign ? 'Reassigning...' : 'Confirm Reassignment'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectModalIssue && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface-950/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-surface-200">
            <div className="flex items-center justify-between border-b border-surface-100 pb-3">
              <div className="flex items-center space-x-2">
                <Ban className="w-5 h-5 text-rose-600" />
                <h3 className="text-base font-bold text-surface-900">Reject Issue Report</h3>
              </div>
              <button
                onClick={() => setRejectModalIssue(null)}
                className="text-surface-400 hover:text-surface-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-surface-500 leading-relaxed">
              Rejecting an issue closes it as invalid or out-of-scope. The student will receive a notification and email explaining the rejection reason.
            </p>

            {rejectError && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                {rejectError}
              </div>
            )}

            <form onSubmit={handleRejectSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-surface-700">
                  Mandatory Rejection Reason <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="e.g., 'Complaint concerns personal devices not maintained by university IT' or 'Duplicate ticket already addressed in CC-2026-xxxxx'..."
                  className="input-field text-xs w-full"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-surface-100">
                <button
                  type="button"
                  onClick={() => setRejectModalIssue(null)}
                  className="btn-secondary !py-2 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReject || !rejectReason.trim()}
                  className="btn-primary !py-2 text-xs bg-rose-600 hover:bg-rose-700 text-white"
                >
                  <Ban className="w-3.5 h-3.5 mr-1.5" />
                  <span>{submittingReject ? 'Rejecting...' : 'Reject Complaint'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
