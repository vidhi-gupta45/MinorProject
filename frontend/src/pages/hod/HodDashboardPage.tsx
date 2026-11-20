import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Layers,
  AlertTriangle,
  PlayCircle,
  CheckCircle2,
  Users,
  RefreshCw,
  ArrowRight,
  GitPullRequest,
  CheckSquare,
  ShieldAlert,
  Inbox,
  Eye,
  BarChart3,
} from 'lucide-react';
import { getDepartmentSummary, getDepartmentIssues } from '../../api/hod';
import { useAuth } from '../../context/AuthContext';
import type { HodDashboardSummary, IssueSummaryResponse } from '../../types';

export const HodDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [summary, setSummary] = useState<HodDashboardSummary>({
    totalIssues: 0,
    unassigned: 0,
    inProgress: 0,
    resolved: 0,
    closed: 0,
    overdue: 0,
    activeHandlersCount: 0,
  });
  const [overdueIssues, setOverdueIssues] = useState<IssueSummaryResponse[]>([]);
  const [recentIssues, setRecentIssues] = useState<IssueSummaryResponse[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [sum, overdue, recent] = await Promise.all([
        getDepartmentSummary(),
        getDepartmentIssues({ overdueOnly: true, size: 5 }),
        getDepartmentIssues({ size: 5 }),
      ]);
      setSummary(sum);
      setOverdueIssues(overdue.content);
      setRecentIssues(recent.content);
    } catch (err) {
      console.error('Failed to load HOD dashboard metrics', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const deptName = user?.department?.name || 'Department';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold text-surface-900">{deptName} — HOD Console</h1>
            <span className="badge bg-amber-50 text-amber-800 border border-amber-200 text-xs">
              Executive Governance
            </span>
          </div>
          <p className="text-xs text-surface-500 mt-0.5">
            Department oversight, SLA monitoring, workload balancing, and routing configuration
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={loadData}
            disabled={loading}
            className="btn-secondary !py-2 text-xs flex items-center space-x-1.5"
            title="Refresh dashboard"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <Link to="/hod/analytics" className="btn-secondary !py-2 text-xs flex items-center space-x-1.5">
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Analytics & Reports</span>
          </Link>
          <Link to="/hod/issues" className="btn-primary !py-2 text-xs flex items-center space-x-1.5">
            <Layers className="w-3.5 h-3.5" />
            <span>All Dept Issues</span>
          </Link>
        </div>
      </div>

      {/* SLA Alert Banner if any overdue issues */}
      {summary.overdue > 0 && (
        <div className="p-4 rounded-xl bg-rose-50 border-2 border-rose-300 text-rose-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fadeIn">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-rose-100 text-rose-700 shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold">
                {summary.overdue} Department Issue{summary.overdue > 1 ? 's' : ''} Breached SLA Deadlines
              </h3>
              <p className="text-xs text-rose-800">
                Turnaround deadlines have been exceeded. Review and reassign or escalate with responsible faculty handlers.
              </p>
            </div>
          </div>
          <Link
            to="/hod/issues?overdue=true"
            className="btn-primary !py-1.5 !px-3 text-xs bg-rose-600 hover:bg-rose-700 text-white shrink-0 self-start sm:self-auto"
          >
            Review Overdue Issues
          </Link>
        </div>
      )}

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3.5">
        <Link
          to="/hod/issues"
          className="card-premium p-4 hover:border-brand-300 transition-all group"
        >
          <span className="text-xs font-semibold text-surface-500">Total Issues</span>
          <div className="text-2xl font-extrabold text-surface-900 mt-2">
            {loading ? '...' : summary.totalIssues}
          </div>
          <p className="text-[11px] text-surface-400 mt-1">Across all categories</p>
        </Link>

        <Link
          to="/hod/issues?status=UNASSIGNED"
          className="card-premium p-4 hover:border-purple-300 transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-purple-700">Unassigned</span>
            <div className="p-1.5 rounded-lg bg-purple-50 text-purple-600">
              <Inbox className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-purple-700 mt-2">
            {loading ? '...' : summary.unassigned}
          </div>
          <p className="text-[11px] text-surface-400 mt-1">Needs assignment</p>
        </Link>

        <Link
          to="/hod/issues?status=IN_PROGRESS"
          className="card-premium p-4 hover:border-amber-300 transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-700">In Progress</span>
            <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
              <PlayCircle className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-amber-700 mt-2">
            {loading ? '...' : summary.inProgress}
          </div>
          <p className="text-[11px] text-surface-400 mt-1">Active repair/work</p>
        </Link>

        <Link
          to="/hod/issues?status=RESOLVED"
          className="card-premium p-4 hover:border-emerald-300 transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-700">Resolved</span>
            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-emerald-700 mt-2">
            {loading ? '...' : summary.resolved}
          </div>
          <p className="text-[11px] text-surface-400 mt-1">Fixed & verified</p>
        </Link>

        <div className="card-premium p-4 border-rose-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-700">Overdue SLA</span>
            <div className="p-1.5 rounded-lg bg-rose-50 text-rose-600">
              <AlertTriangle className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-rose-700 mt-2">
            {loading ? '...' : summary.overdue}
          </div>
          <p className="text-[11px] text-rose-400 mt-1">Breached deadline</p>
        </div>

        <div className="card-premium p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-blue-700">Coordinators</span>
            <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
              <Users className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-blue-700 mt-2">
            {loading ? '...' : summary.activeHandlersCount}
          </div>
          <p className="text-[11px] text-surface-400 mt-1">Assigned faculty</p>
        </div>
      </div>

      {/* Two Column Section: SLA Escalation Radar & Recent Department Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: SLA Risk Radar */}
        <div className="card-premium p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-surface-100 pb-3">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              <h2 className="text-sm font-bold text-surface-900">SLA Breach Radar</h2>
            </div>
            <Link
              to="/hod/issues?overdue=true"
              className="text-xs text-brand-600 hover:text-brand-800 font-semibold flex items-center space-x-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {overdueIssues.length > 0 ? (
            <div className="divide-y divide-surface-100">
              {overdueIssues.map((issue) => (
                <div key={issue.id} className="py-2.5 flex items-center justify-between gap-2">
                  <div className="space-y-0.5">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-xs font-bold text-rose-700">{issue.publicIssueId}</span>
                      <span className="badge bg-rose-50 text-rose-700 border border-rose-200 text-[10px]">
                        Overdue
                      </span>
                    </div>
                    <div className="text-xs font-semibold text-surface-900">{issue.title}</div>
                    <div className="text-[11px] text-surface-400">
                      Handler: {issue.assignedHandlerName || 'Unassigned'} • {issue.categoryName}
                    </div>
                  </div>

                  <Link
                    to={`/handler/issues/${issue.id}`}
                    className="btn-secondary !py-1 !px-2.5 text-xs shrink-0 flex items-center space-x-1"
                  >
                    <Eye className="w-3 h-3" />
                    <span>Inspect</span>
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-surface-400 space-y-2">
              <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500 stroke-1" />
              <p className="text-xs font-medium text-surface-700">100% SLA Compliance</p>
              <p className="text-[11px] text-surface-400">No overdue tickets in your department queue.</p>
            </div>
          )}
        </div>

        {/* Right: Quick Governance & Routing Controls */}
        <div className="card-premium p-5 space-y-4">
          <div className="border-b border-surface-100 pb-3">
            <h2 className="text-sm font-bold text-surface-900">Governance & Management Tools</h2>
            <p className="text-[11px] text-surface-400">Configure department workflow routing and oversee staff assignments</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <Link
              to="/hod/issues"
              className="p-4 rounded-xl border border-surface-200 hover:border-brand-400 bg-surface-50/50 hover:bg-brand-50/20 transition-all group"
            >
              <div className="w-8 h-8 rounded-lg bg-brand-100 text-brand-700 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                <CheckSquare className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-bold text-surface-900">Department Issues</h3>
              <p className="text-[11px] text-surface-500 mt-1">
                Filter all tickets, override assignments, and reject out-of-scope complaints.
              </p>
            </Link>

            <Link
              to="/hod/routing"
              className="p-4 rounded-xl border border-surface-200 hover:border-purple-400 bg-surface-50/50 hover:bg-purple-50/20 transition-all group"
            >
              <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                <GitPullRequest className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-bold text-surface-900">Category Routing Rules</h3>
              <p className="text-[11px] text-surface-500 mt-1">
                Map categories like IT, Lab, Electrical to designated faculty coordinators.
              </p>
            </Link>
          </div>

          <div className="p-3.5 rounded-xl bg-surface-50 border border-surface-200 text-xs text-surface-600 space-y-1">
            <span className="font-semibold text-surface-800">Automated Escalation Rule:</span>
            <p className="text-[11px] leading-relaxed text-surface-500">
              The automated SLA scheduler evaluates tickets every 15 minutes. Breached issues automatically trigger high-priority alerts to the HOD and responsible handlers.
            </p>
          </div>
        </div>
      </div>

      {/* Recent Department Activity Table */}
      <div className="card-premium p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-surface-100 pb-3">
          <div className="flex items-center space-x-2">
            <Layers className="w-4 h-4 text-brand-600" />
            <h2 className="text-sm font-bold text-surface-900">Recent Department Activity</h2>
          </div>
          <Link
            to="/hod/issues"
            className="text-xs text-brand-600 hover:text-brand-800 font-semibold flex items-center space-x-1"
          >
            <span>View All Department Tickets</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recentIssues.length > 0 ? (
          <div className="divide-y divide-surface-100">
            {recentIssues.map((issue) => (
              <div
                key={issue.id}
                className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-surface-50/50 rounded-lg px-2 transition-colors"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-xs font-bold text-surface-800">{issue.publicIssueId}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface-100 text-surface-700 font-medium">
                      {issue.categoryName}
                    </span>
                    <span className="badge bg-surface-100 text-surface-600 text-[10px]">{issue.status}</span>
                  </div>
                  <h3 className="text-xs font-semibold text-surface-900">{issue.title}</h3>
                  <div className="text-[11px] text-surface-400">
                    Coordinator: {issue.assignedHandlerName || 'Unassigned'} • Location: {issue.location} •{' '}
                    {new Date(issue.createdAt).toLocaleDateString()}
                  </div>
                </div>

                <Link
                  to={`/handler/issues/${issue.id}`}
                  className="btn-secondary !py-1 !px-2.5 text-xs flex items-center space-x-1 shrink-0 self-end sm:self-center"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Inspect</span>
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-surface-400 text-center py-6">No recent department issues reported.</p>
        )}
      </div>
    </div>
  );
};
