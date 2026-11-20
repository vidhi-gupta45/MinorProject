import React, { useEffect, useState, useCallback } from 'react';
import {
  BarChart3,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Download,
  RefreshCw,
  Calendar,
  Layers,
  ShieldCheck,
  FileSpreadsheet,
  Activity,
  ArrowUpRight,
  TrendingUp,
} from 'lucide-react';
import { getDepartmentAnalytics, exportIssuesCsv } from '../../api/analytics';
import { useAuth } from '../../context/AuthContext';
import type { AnalyticsSummaryDto, IssueStatus } from '../../types';

export const DeptAnalyticsPage: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<AnalyticsSummaryDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // CSV Export Filter State
  const [exportStatus, setExportStatus] = useState<IssueStatus | ''>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [exporting, setExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState<string | null>(null);

  const loadAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const summary = await getDepartmentAnalytics();
      setData(summary);
    } catch (err: unknown) {
      console.error('Failed to load department analytics', err);
      setError('Failed to retrieve real-time analytics data. Please ensure the backend service is running.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  const handleExportCsv = async (e: React.FormEvent) => {
    e.preventDefault();
    setExporting(true);
    setExportSuccess(null);
    try {
      await exportIssuesCsv({
        status: exportStatus,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });
      setExportSuccess('CSV report downloaded successfully!');
      setTimeout(() => setExportSuccess(null), 4000);
    } catch (err) {
      console.error('Failed to export CSV', err);
      alert('Failed to generate CSV export. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const deptName = user?.department?.name || 'Department';

  const total = data?.totalIssues || 0;
  const resolvedAndClosed = (data?.resolvedIssues || 0) + (data?.closedIssues || 0);
  const resolutionPercentage = total > 0 ? ((resolvedAndClosed / total) * 100).toFixed(1) : '0.0';

  const getSlaColor = (rate: number) => {
    if (rate >= 90) return 'text-emerald-600 bg-emerald-50 border-emerald-200';
    if (rate >= 75) return 'text-amber-600 bg-amber-50 border-amber-200';
    return 'text-rose-600 bg-rose-50 border-rose-200';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return 'bg-rose-500';
      case 'HIGH':
        return 'bg-orange-500';
      case 'MEDIUM':
        return 'bg-amber-500';
      case 'LOW':
        return 'bg-emerald-500';
      default:
        return 'bg-brand-500';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SUBMITTED':
        return 'bg-blue-400';
      case 'ASSIGNED':
        return 'bg-indigo-400';
      case 'ACKNOWLEDGED':
        return 'bg-purple-400';
      case 'IN_PROGRESS':
        return 'bg-amber-500';
      case 'RESOLVED':
        return 'bg-emerald-500';
      case 'CLOSED':
        return 'bg-surface-500';
      case 'REOPENED':
        return 'bg-rose-500';
      default:
        return 'bg-brand-400';
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-surface-200 pb-5">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-50 text-brand-700 border border-brand-200">
              {deptName}
            </span>
            <span className="text-surface-400 text-xs">• Live SLA & Performance Intelligence</span>
          </div>
          <h1 className="text-2xl font-bold text-surface-900 tracking-tight mt-1 flex items-center space-x-2">
            <BarChart3 className="w-6 h-6 text-brand-600" />
            <span>Department Analytics & Reports</span>
          </h1>
          <p className="text-sm text-surface-500 mt-1">
            Turnaround times, SLA breach rates, MTTR, and exportable audit records for continuous resolution improvement.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={loadAnalytics}
            disabled={loading}
            className="btn btn-secondary flex items-center space-x-2 text-sm"
            title="Refresh metrics"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <a
            href="#csv-export-section"
            className="btn btn-primary flex items-center space-x-2 text-sm"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </a>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center justify-between">
          <span>{error}</span>
          <button onClick={loadAnalytics} className="font-semibold underline ml-4">
            Retry
          </button>
        </div>
      )}

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Issues */}
        <div className="card p-5 bg-white border border-surface-200 shadow-sm rounded-xl">
          <div className="flex items-center justify-between text-surface-500 text-sm font-medium">
            <span>Total Tracked</span>
            <div className="p-2 rounded-lg bg-surface-100 text-surface-600">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-3xl font-bold text-surface-900">
              {loading ? '—' : data?.totalIssues ?? 0}
            </span>
            <span className="text-xs text-surface-400">tickets filed</span>
          </div>
          <div className="mt-3 text-xs text-surface-500 flex items-center space-x-1">
            <TrendingUp className="w-3.5 h-3.5 text-brand-600" />
            <span>Scope: {deptName}</span>
          </div>
        </div>

        {/* Active / In Progress */}
        <div className="card p-5 bg-white border border-surface-200 shadow-sm rounded-xl">
          <div className="flex items-center justify-between text-surface-500 text-sm font-medium">
            <span>Active / Open</span>
            <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-3xl font-bold text-amber-600">
              {loading ? '—' : (data?.openIssues || 0) + (data?.inProgressIssues || 0)}
            </span>
            <span className="text-xs text-surface-400">in pipeline</span>
          </div>
          <div className="mt-3 text-xs text-surface-500">
            <span>{data?.inProgressIssues || 0} currently with handlers</span>
          </div>
        </div>

        {/* Resolved & Closed */}
        <div className="card p-5 bg-white border border-surface-200 shadow-sm rounded-xl">
          <div className="flex items-center justify-between text-surface-500 text-sm font-medium">
            <span>Resolved & Closed</span>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-3xl font-bold text-emerald-600">
              {loading ? '—' : resolvedAndClosed}
            </span>
            <span className="text-xs text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded">
              {resolutionPercentage}%
            </span>
          </div>
          <div className="mt-3 text-xs text-surface-500">
            <span>{data?.closedIssues || 0} student-verified closed</span>
          </div>
        </div>

        {/* Overdue Breaches */}
        <div className="card p-5 bg-white border border-surface-200 shadow-sm rounded-xl">
          <div className="flex items-center justify-between text-surface-500 text-sm font-medium">
            <span>Overdue SLA Breaches</span>
            <div className="p-2 rounded-lg bg-rose-50 text-rose-600">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-3xl font-bold text-rose-600">
              {loading ? '—' : data?.overdueIssues ?? 0}
            </span>
            <span className="text-xs text-surface-400">tickets escalated</span>
          </div>
          <div className="mt-3 text-xs text-rose-600 flex items-center space-x-1">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Requires supervisor intervention</span>
          </div>
        </div>
      </div>

      {/* SLA Compliance & MTTR Turnaround Performance (2 Columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* SLA Compliance Card */}
        <div className="card p-6 bg-white border border-surface-200 rounded-xl shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-brand-600 uppercase tracking-wider">
                Service Level Agreement
              </div>
              <h2 className="text-lg font-bold text-surface-900 mt-0.5 flex items-center space-x-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <span>SLA Compliance Rate</span>
              </h2>
            </div>
            <div className={`px-3 py-1 rounded-full text-xs font-bold border ${getSlaColor(data?.slaComplianceRate ?? 100)}`}>
              {loading ? '...' : `${(data?.slaComplianceRate ?? 100).toFixed(1)}%`}
            </div>
          </div>

          <p className="text-sm text-surface-600 leading-relaxed">
            Percentage of department issues resolved within institutional SLA turnaround targets before the deadline timestamp.
          </p>

          {/* Visual Progress Bar */}
          <div className="space-y-1.5 pt-2">
            <div className="flex justify-between text-xs text-surface-500">
              <span>0%</span>
              <span className="font-semibold text-surface-700">Campus Target: ≥ 95.0%</span>
              <span>100%</span>
            </div>
            <div className="w-full h-3 bg-surface-100 rounded-full overflow-hidden p-0.5">
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  (data?.slaComplianceRate ?? 100) >= 90
                    ? 'bg-emerald-500'
                    : (data?.slaComplianceRate ?? 100) >= 75
                    ? 'bg-amber-500'
                    : 'bg-rose-500'
                }`}
                style={{ width: `${Math.min(data?.slaComplianceRate ?? 100, 100)}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
            <div className="p-3 bg-surface-50 rounded-lg border border-surface-200">
              <span className="text-surface-500">On-Time Resolutions:</span>
              <p className="font-bold text-surface-800 text-sm mt-0.5">
                {Math.max(0, (data?.totalIssues || 0) - (data?.overdueIssues || 0))}
              </p>
            </div>
            <div className="p-3 bg-rose-50 rounded-lg border border-rose-200">
              <span className="text-rose-700 font-medium">SLA Escalations:</span>
              <p className="font-bold text-rose-800 text-sm mt-0.5">
                {data?.overdueIssues || 0}
              </p>
            </div>
          </div>
        </div>

        {/* MTTR Mean Time to Resolution */}
        <div className="card p-6 bg-white border border-surface-200 rounded-xl shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-brand-600 uppercase tracking-wider">
                Resolution Velocity
              </div>
              <h2 className="text-lg font-bold text-surface-900 mt-0.5 flex items-center space-x-2">
                <Clock className="w-5 h-5 text-brand-600" />
                <span>Mean Time to Resolution (MTTR)</span>
              </h2>
            </div>
            <div className="px-3 py-1 rounded-full text-xs font-bold bg-brand-50 text-brand-700 border border-brand-200">
              {loading ? '...' : `${(data?.averageResolutionHours ?? 0).toFixed(1)} hrs`}
            </div>
          </div>

          <p className="text-sm text-surface-600 leading-relaxed">
            Average turnaround duration calculated from issue creation timestamp to handler resolution timestamp across completed tickets.
          </p>

          <div className="p-4 bg-surface-50 rounded-xl border border-surface-200 flex items-center justify-between">
            <div>
              <div className="text-2xl font-black text-surface-900 tracking-tight">
                {loading ? '—' : `${(data?.averageResolutionHours ?? 0).toFixed(1)}`}
                <span className="text-sm font-normal text-surface-500 ml-1.5">Hours</span>
              </div>
              <div className="text-xs text-surface-500 mt-0.5">
                Approx. {((data?.averageResolutionHours ?? 0) / 24).toFixed(1)} business days per issue
              </div>
            </div>

            <div className="text-right">
              <span className="inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800">
                <ArrowUpRight className="w-3.5 h-3.5 mr-1" />
                Continuous SLA Tracking
              </span>
            </div>
          </div>

          <div className="text-xs text-surface-500 leading-relaxed">
            💡 <strong>Benchmark tip:</strong> High turnaround times in specific categories indicate equipment bottlenecks or shortage of specialized technicians.
          </div>
        </div>
      </div>

      {/* Distribution Breakdown Visual Cards (3 Columns) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Category Distribution */}
        <div className="card p-5 bg-white border border-surface-200 rounded-xl shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-surface-100 pb-2">
            <h3 className="font-bold text-sm text-surface-900 flex items-center space-x-2">
              <Layers className="w-4 h-4 text-brand-600" />
              <span>By Category</span>
            </h3>
            <span className="text-xs text-surface-400">Total Count</span>
          </div>

          <div className="space-y-3 pt-1">
            {data?.categoryDistribution && Object.keys(data.categoryDistribution).length > 0 ? (
              Object.entries(data.categoryDistribution).map(([category, count]) => {
                const pct = total > 0 ? ((count / total) * 100).toFixed(0) : '0';
                return (
                  <div key={category} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-medium text-surface-700 truncate max-w-[180px]" title={category}>
                        {category}
                      </span>
                      <span className="text-surface-500 font-semibold">{count} ({pct}%)</span>
                    </div>
                    <div className="w-full h-2 bg-surface-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-brand-500 rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-xs text-surface-400 py-4 text-center">No category data recorded yet</p>
            )}
          </div>
        </div>

        {/* Status Distribution */}
        <div className="card p-5 bg-white border border-surface-200 rounded-xl shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-surface-100 pb-2">
            <h3 className="font-bold text-sm text-surface-900 flex items-center space-x-2">
              <Activity className="w-4 h-4 text-brand-600" />
              <span>By Workflow Status</span>
            </h3>
            <span className="text-xs text-surface-400">Active Pipeline</span>
          </div>

          <div className="space-y-3 pt-1">
            {data?.statusDistribution && Object.keys(data.statusDistribution).length > 0 ? (
              Object.entries(data.statusDistribution).map(([st, count]) => {
                const pct = total > 0 ? ((count / total) * 100).toFixed(0) : '0';
                return (
                  <div key={st} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-medium text-surface-700">{st}</span>
                      <span className="text-surface-500 font-semibold">{count} ({pct}%)</span>
                    </div>
                    <div className="w-full h-2 bg-surface-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${getStatusColor(st)}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-xs text-surface-400 py-4 text-center">No status data recorded yet</p>
            )}
          </div>
        </div>

        {/* Priority Distribution */}
        <div className="card p-5 bg-white border border-surface-200 rounded-xl shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-surface-100 pb-2">
            <h3 className="font-bold text-sm text-surface-900 flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <span>By Priority Tier</span>
            </h3>
            <span className="text-xs text-surface-400">Severity</span>
          </div>

          <div className="space-y-3 pt-1">
            {data?.priorityDistribution && Object.keys(data.priorityDistribution).length > 0 ? (
              Object.entries(data.priorityDistribution).map(([prio, count]) => {
                const pct = total > 0 ? ((count / total) * 100).toFixed(0) : '0';
                return (
                  <div key={prio} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-medium text-surface-700">{prio}</span>
                      <span className="text-surface-500 font-semibold">{count} ({pct}%)</span>
                    </div>
                    <div className="w-full h-2 bg-surface-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${getPriorityColor(prio)}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-xs text-surface-400 py-4 text-center">No priority data recorded yet</p>
            )}
          </div>
        </div>
      </div>

      {/* CSV Export & Audit Report Section */}
      <div id="csv-export-section" className="card p-6 bg-white border border-surface-200 rounded-xl shadow-sm space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-surface-100 pb-4">
          <div>
            <div className="flex items-center space-x-2">
              <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
              <h2 className="text-lg font-bold text-surface-900">Department CSV Audit Export</h2>
            </div>
            <p className="text-xs text-surface-500 mt-1">
              Export filtered issue lifecycle records compliant with RFC 4180 for department reporting, accreditation audits, and offline spreadsheet analysis.
            </p>
          </div>
          <span className="text-xs px-2.5 py-1 bg-surface-100 text-surface-600 rounded-full self-start md:self-auto font-mono">
            text/csv format
          </span>
        </div>

        {exportSuccess && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-sm flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{exportSuccess}</span>
          </div>
        )}

        <form onSubmit={handleExportCsv} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          {/* Status Filter */}
          <div>
            <label className="block text-xs font-semibold text-surface-700 mb-1">
              Issue Status
            </label>
            <select
              value={exportStatus}
              onChange={(e) => setExportStatus(e.target.value as IssueStatus | '')}
              className="input text-sm w-full"
            >
              <option value="">All Statuses</option>
              <option value="SUBMITTED">SUBMITTED</option>
              <option value="ASSIGNED">ASSIGNED</option>
              <option value="ACKNOWLEDGED">ACKNOWLEDGED</option>
              <option value="IN_PROGRESS">IN_PROGRESS</option>
              <option value="RESOLVED">RESOLVED</option>
              <option value="CLOSED">CLOSED</option>
              <option value="REOPENED">REOPENED</option>
            </select>
          </div>

          {/* Start Date */}
          <div>
            <label className="block text-xs font-semibold text-surface-700 mb-1 flex items-center space-x-1">
              <Calendar className="w-3.5 h-3.5 text-surface-400" />
              <span>Start Date</span>
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="input text-sm w-full"
            />
          </div>

          {/* End Date */}
          <div>
            <label className="block text-xs font-semibold text-surface-700 mb-1 flex items-center space-x-1">
              <Calendar className="w-3.5 h-3.5 text-surface-400" />
              <span>End Date</span>
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="input text-sm w-full"
            />
          </div>

          {/* Download Action */}
          <div>
            <button
              type="submit"
              disabled={exporting}
              className="btn btn-primary w-full flex items-center justify-center space-x-2 text-sm h-[42px]"
            >
              {exporting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Generating CSV...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Download Report (.csv)</span>
                </>
              )}
            </button>
          </div>
        </form>

        <div className="p-3 bg-surface-50 rounded-lg border border-surface-200 text-xs text-surface-500">
          <strong>Export includes:</strong> Ticket ID, Public Code, Title, Category, Priority, Lifecycle Status, Location, Student Reporter, Assigned Faculty Handler, Creation Date, Response SLA Due, Resolution SLA Due, Resolution Date, Total Resolution Turnaround Hours, SLA Breach Flag, and Escalation Tier.
        </div>
      </div>
    </div>
  );
};
export default DeptAnalyticsPage;
