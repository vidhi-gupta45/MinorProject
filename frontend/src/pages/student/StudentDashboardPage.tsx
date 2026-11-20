import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FilePlus,
  ListOrdered,
  Clock,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  MapPin,
  Sparkles,
} from 'lucide-react';
import { getStudentDashboardSummary, getMyIssues } from '../../api/issue';
import type { StudentDashboardSummary, IssueSummaryResponse, IssueStatus } from '../../types';

export const StudentDashboardPage: React.FC = () => {
  const [summary, setSummary] = useState<StudentDashboardSummary>({
    totalSubmitted: 0,
    inProgress: 0,
    resolved: 0,
    closed: 0,
  });
  const [recentIssues, setRecentIssues] = useState<IssueSummaryResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getStudentDashboardSummary(),
      getMyIssues({ size: 5 }),
    ])
      .then(([summaryData, issuesData]) => {
        setSummary(summaryData);
        setRecentIssues(issuesData.content);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

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
      default:
        return <span className="badge bg-surface-100 text-surface-700">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-brand-900 via-brand-800 to-indigo-900 text-white shadow-elevated flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-brand-500/20 text-brand-200 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Student Portal</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">CampusCare Student Center</h1>
          <p className="text-xs text-brand-200 max-w-xl">
            Report maintenance, laboratory, academic, IT, or sanitation issues directly to your department coordinators.
          </p>
        </div>

        <Link to="/student/report" className="btn-primary !bg-white !text-brand-900 hover:!bg-brand-50 !py-2.5 !px-4 text-xs font-bold whitespace-nowrap shadow-md">
          <FilePlus className="w-4 h-4 mr-1.5" />
          <span>Report an Issue</span>
        </Link>
      </div>

      {/* Real KPI Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="card-premium p-4">
          <div className="flex items-center justify-between text-xs text-surface-500">
            <span>Total Reported</span>
            <ListOrdered className="w-4 h-4 text-surface-400" />
          </div>
          <div className="text-3xl font-extrabold text-surface-900 mt-2 font-mono">
            {loading ? '-' : summary.totalSubmitted}
          </div>
          <div className="text-[11px] text-surface-400 mt-1">Submitted by you</div>
        </div>

        <div className="card-premium p-4">
          <div className="flex items-center justify-between text-xs text-amber-600 font-medium">
            <span>In Progress</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-3xl font-extrabold text-amber-700 mt-2 font-mono">
            {loading ? '-' : summary.inProgress}
          </div>
          <div className="text-[11px] text-surface-400 mt-1">Being actively addressed</div>
        </div>

        <div className="card-premium p-4">
          <div className="flex items-center justify-between text-xs text-emerald-600 font-medium">
            <span>Resolved</span>
            <CheckCircle className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-3xl font-extrabold text-emerald-700 mt-2 font-mono">
            {loading ? '-' : summary.resolved}
          </div>
          <div className="text-[11px] text-surface-400 mt-1">Awaiting your verification</div>
        </div>

        <div className="card-premium p-4">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Closed</span>
            <AlertCircle className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-3xl font-extrabold text-slate-700 mt-2 font-mono">
            {loading ? '-' : summary.closed}
          </div>
          <div className="text-[11px] text-surface-400 mt-1">Completed & verified</div>
        </div>
      </div>

      {/* Recent Issues Feed */}
      <div className="card-premium p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-surface-900">Recent Reported Issues</h3>
            <p className="text-xs text-surface-500">Your latest submissions and active progress</p>
          </div>
          <Link to="/student/issues" className="text-xs text-brand-600 font-semibold hover:underline flex items-center space-x-1">
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="py-12 text-center">
            <div className="w-7 h-7 border-3 border-brand-200 border-t-brand-600 rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs text-surface-500">Loading issues...</p>
          </div>
        ) : recentIssues.length === 0 ? (
          <div className="py-10 text-center bg-surface-50 rounded-xl border border-dashed border-surface-200 p-6">
            <p className="text-xs text-surface-500 mb-3">You haven't reported any campus issues yet.</p>
            <Link to="/student/report" className="btn-primary text-xs">
              <FilePlus className="w-3.5 h-3.5 mr-1.5" />
              <span>Report Your First Issue</span>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-50 border-b border-surface-200 text-surface-500 uppercase tracking-wider text-[10px] font-semibold">
                <tr>
                  <th className="px-4 py-3">ID</th>
                  <th className="px-4 py-3">Title & Category</th>
                  <th className="px-4 py-3">Location</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100">
                {recentIssues.map((issue) => (
                  <tr key={issue.id} className="hover:bg-surface-50/70 transition-colors">
                    <td className="px-4 py-3.5 font-mono font-bold text-brand-700 whitespace-nowrap">
                      {issue.publicIssueId}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="font-semibold text-surface-900 line-clamp-1">{issue.title}</div>
                      <div className="text-[11px] text-surface-400 mt-0.5">{issue.categoryName}</div>
                    </td>
                    <td className="px-4 py-3.5 text-surface-600 whitespace-nowrap">
                      <div className="flex items-center space-x-1">
                        <MapPin className="w-3.5 h-3.5 text-surface-400" />
                        <span>{issue.location}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      {getStatusBadge(issue.status)}
                    </td>
                    <td className="px-4 py-3.5 text-right whitespace-nowrap">
                      <Link
                        to={`/student/issues/${issue.id}`}
                        className="text-brand-600 hover:text-brand-800 font-semibold text-xs inline-flex items-center space-x-1"
                      >
                        <span>View</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
