import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Inbox,
  CheckCircle2,
  Clock,
  PlayCircle,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Eye,
  CheckSquare,
} from 'lucide-react';
import { getHandlerWorkload, getAssignedIssues, acknowledgeIssue } from '../../api/handler';
import type { HandlerDashboardSummary, IssueSummaryResponse } from '../../types';

export const HandlerDashboardPage: React.FC = () => {
  const [summary, setSummary] = useState<HandlerDashboardSummary>({
    assigned: 0,
    acknowledged: 0,
    inProgress: 0,
    resolved: 0,
    overdue: 0,
  });
  const [pendingIssues, setPendingIssues] = useState<IssueSummaryResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [acknowledgingId, setAcknowledgingId] = useState<number | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [workload, assigned] = await Promise.all([
        getHandlerWorkload(),
        getAssignedIssues({ status: 'ASSIGNED', size: 5 }),
      ]);
      setSummary(workload);
      setPendingIssues(assigned.content);
    } catch (err) {
      console.error('Failed to load handler dashboard data', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAcknowledge = async (id: number, publicId: string) => {
    setAcknowledgingId(id);
    setActionSuccess(null);
    try {
      await acknowledgeIssue(id);
      setActionSuccess(`Issue ${publicId} successfully acknowledged!`);
      await loadData();
    } catch (err) {
      console.error('Failed to acknowledge issue', err);
    } finally {
      setAcknowledgingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Faculty & Handler Workspace</h1>
          <p className="text-xs text-surface-500">
            Acknowledge routed campus issues, coordinate remediation, and report resolutions
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={loadData}
            disabled={loading}
            className="btn-secondary !py-2 text-xs flex items-center space-x-1.5"
            title="Refresh dashboard metrics"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <Link to="/handler/issues" className="btn-primary !py-2 text-xs flex items-center space-x-1.5">
            <CheckSquare className="w-3.5 h-3.5" />
            <span>View All Assigned</span>
          </Link>
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

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        <Link
          to="/handler/issues?status=ASSIGNED"
          className="card-premium p-4 hover:border-purple-300 transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-purple-700">Assigned</span>
            <div className="p-2 rounded-lg bg-purple-50 text-purple-600 group-hover:scale-110 transition-transform">
              <Inbox className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-surface-900 mt-2">
            {loading ? '...' : summary.assigned}
          </div>
          <p className="text-[11px] text-surface-400 mt-1">Pending acknowledgment</p>
        </Link>

        <Link
          to="/handler/issues?status=ACKNOWLEDGED"
          className="card-premium p-4 hover:border-indigo-300 transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-indigo-700">Acknowledged</span>
            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600 group-hover:scale-110 transition-transform">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-surface-900 mt-2">
            {loading ? '...' : summary.acknowledged}
          </div>
          <p className="text-[11px] text-surface-400 mt-1">Ready to start repair</p>
        </Link>

        <Link
          to="/handler/issues?status=IN_PROGRESS"
          className="card-premium p-4 hover:border-amber-300 transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-700">In Progress</span>
            <div className="p-2 rounded-lg bg-amber-50 text-amber-600 group-hover:scale-110 transition-transform">
              <PlayCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-surface-900 mt-2">
            {loading ? '...' : summary.inProgress}
          </div>
          <p className="text-[11px] text-surface-400 mt-1">Under active work</p>
        </Link>

        <Link
          to="/handler/issues?status=RESOLVED"
          className="card-premium p-4 hover:border-emerald-300 transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-700">Resolved</span>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 group-hover:scale-110 transition-transform">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-surface-900 mt-2">
            {loading ? '...' : summary.resolved}
          </div>
          <p className="text-[11px] text-surface-400 mt-1">Awaiting student sign-off</p>
        </Link>

        <div className="card-premium p-4 border-rose-100 col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-700">Overdue SLA</span>
            <div className="p-2 rounded-lg bg-rose-50 text-rose-600">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-rose-600 mt-2">
            {loading ? '...' : summary.overdue}
          </div>
          <p className="text-[11px] text-rose-400 mt-1">Exceeded response/fix time</p>
        </div>
      </div>

      {/* Immediate Attention Queue */}
      <div className="card-premium p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-surface-100 pb-3">
          <div className="flex items-center space-x-2">
            <Inbox className="w-4 h-4 text-purple-600" />
            <h2 className="text-sm font-bold text-surface-900">Pending Acknowledgment Queue</h2>
            <span className="badge bg-purple-50 text-purple-700 border border-purple-200">
              {pendingIssues.length} requiring ack
            </span>
          </div>
          <Link
            to="/handler/issues?status=ASSIGNED"
            className="text-xs text-brand-600 hover:text-brand-800 font-semibold flex items-center space-x-1"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {pendingIssues.length > 0 ? (
          <div className="divide-y divide-surface-100">
            {pendingIssues.map((issue) => (
              <div
                key={issue.id}
                className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-surface-50/50 rounded-lg px-2 transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-xs font-bold text-surface-800">{issue.publicIssueId}</span>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                        issue.priority === 'CRITICAL'
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : issue.priority === 'HIGH'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-surface-100 text-surface-700 border-surface-200'
                      }`}
                    >
                      {issue.priority}
                    </span>
                    <span className="text-xs text-surface-500 font-medium">{issue.categoryName}</span>
                  </div>
                  <h3 className="text-xs font-semibold text-surface-900">{issue.title}</h3>
                  <div className="flex items-center space-x-3 text-[11px] text-surface-400">
                    <span>Location: {issue.location}</span>
                    <span>•</span>
                    <span>Received: {new Date(issue.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-2 self-end sm:self-center">
                  <Link
                    to={`/handler/issues/${issue.id}`}
                    className="btn-secondary !py-1.5 !px-3 text-xs flex items-center space-x-1"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Inspect</span>
                  </Link>
                  <button
                    onClick={() => handleAcknowledge(issue.id, issue.publicIssueId)}
                    disabled={acknowledgingId === issue.id}
                    className="btn-primary !py-1.5 !px-3 text-xs flex items-center space-x-1 bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    <CheckSquare className="w-3.5 h-3.5" />
                    <span>{acknowledgingId === issue.id ? 'Acknowledging...' : 'Acknowledge'}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-surface-400 space-y-2">
            <ShieldCheck className="w-10 h-10 mx-auto text-emerald-500 stroke-1" />
            <p className="text-xs font-medium text-surface-700">All caught up!</p>
            <p className="text-[11px] text-surface-400">No newly assigned issues waiting for acknowledgment.</p>
          </div>
        )}
      </div>

      {/* Operational Protocol & Workflow Guidelines */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-purple-50/60 border border-purple-100 space-y-1.5">
          <div className="text-xs font-bold text-purple-900 flex items-center space-x-1.5">
            <span className="w-5 h-5 rounded-full bg-purple-200 text-purple-800 flex items-center justify-center text-[10px]">
              1
            </span>
            <span>Acknowledge SLA</span>
          </div>
          <p className="text-xs text-purple-800/80 leading-relaxed">
            Acknowledge issues promptly to stop the response SLA timer and notify the student that remediation has begun.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-100 space-y-1.5">
          <div className="text-xs font-bold text-amber-900 flex items-center space-x-1.5">
            <span className="w-5 h-5 rounded-full bg-amber-200 text-amber-800 flex items-center justify-center text-[10px]">
              2
            </span>
            <span>Document Progress</span>
          </div>
          <p className="text-xs text-amber-800/80 leading-relaxed">
            Record internal staff notes for maintenance crew or vendor communications without exposing them to students.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-100 space-y-1.5">
          <div className="text-xs font-bold text-emerald-900 flex items-center space-x-1.5">
            <span className="w-5 h-5 rounded-full bg-emerald-200 text-emerald-800 flex items-center justify-center text-[10px]">
              3
            </span>
            <span>Propose Resolution</span>
          </div>
          <p className="text-xs text-emerald-800/80 leading-relaxed">
            Submit resolution notes with photo evidence. The student then verifies and closes or reopens if needed.
          </p>
        </div>
      </div>
    </div>
  );
};
