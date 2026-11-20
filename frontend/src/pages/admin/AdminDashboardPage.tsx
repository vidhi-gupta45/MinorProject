import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Shield,
  Users,
  Layers,
  Settings,
  Activity,
  ArrowRight,
  RefreshCw,
  CheckCircle2,
  Building,
  TrendingUp,
} from 'lucide-react';
import { getAdminStats } from '../../api/admin';
import { getInstitutionalAnalytics } from '../../api/analytics';
import type { AdminStatsDto, AnalyticsSummaryDto } from '../../types';

export const AdminDashboardPage: React.FC = () => {
  const [stats, setStats] = useState<AdminStatsDto | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsSummaryDto | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [statsData, analyticsData] = await Promise.all([
        getAdminStats(),
        getInstitutionalAnalytics().catch(() => null),
      ]);
      setStats(statsData);
      setAnalytics(analyticsData);
    } catch (err) {
      console.error('Failed to load admin stats', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-surface-200 pb-5">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              Root Authority
            </span>
            <span className="text-surface-400 text-xs">• Global Governance</span>
          </div>
          <h1 className="text-2xl font-bold text-surface-900 tracking-tight mt-1 flex items-center space-x-2">
            <Shield className="w-6 h-6 text-brand-600" />
            <span>CampusCare Administrator Console</span>
          </h1>
          <p className="text-sm text-surface-500 mt-1">
            Global account provisioning, department catalog, category SLA response thresholds, and institution audit trails.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={loadData}
            disabled={loading}
            className="btn btn-secondary flex items-center space-x-2 text-sm"
            title="Refresh statistics"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <Link to="/admin/users" className="btn btn-primary flex items-center space-x-2 text-sm">
            <Users className="w-4 h-4" />
            <span>Manage Users</span>
          </Link>
        </div>
      </div>

      {/* Primary KPI Vitals */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Users */}
        <Link
          to="/admin/users"
          className="card p-5 bg-white border border-surface-200 shadow-sm rounded-xl hover:border-brand-300 transition-all group"
        >
          <div className="flex items-center justify-between text-surface-500 text-sm font-medium">
            <span>Total Accounts</span>
            <div className="p-2 rounded-lg bg-brand-50 text-brand-600 group-hover:scale-110 transition-transform">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-3xl font-bold text-surface-900">
              {loading ? '—' : stats?.totalUsers ?? 0}
            </span>
            <span className="text-xs text-surface-400">users</span>
          </div>
          <div className="mt-3 text-xs text-brand-600 flex items-center justify-between font-medium">
            <span>{stats?.activeHandlers ?? 0} Faculty Handlers</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </Link>

        {/* Departments */}
        <div className="card p-5 bg-white border border-surface-200 shadow-sm rounded-xl">
          <div className="flex items-center justify-between text-surface-500 text-sm font-medium">
            <span>Departments</span>
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
              <Building className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-3xl font-bold text-blue-700">
              {loading ? '—' : stats?.totalDepartments ?? 0}
            </span>
            <span className="text-xs text-surface-400">academic units</span>
          </div>
          <div className="mt-3 text-xs text-surface-500">
            <span>Active routing domains</span>
          </div>
        </div>

        {/* Categories & SLA Policies */}
        <Link
          to="/admin/categories"
          className="card p-5 bg-white border border-surface-200 shadow-sm rounded-xl hover:border-purple-300 transition-all group"
        >
          <div className="flex items-center justify-between text-surface-500 text-sm font-medium">
            <span>Categories & SLA</span>
            <div className="p-2 rounded-lg bg-purple-50 text-purple-600 group-hover:scale-110 transition-transform">
              <Settings className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-3xl font-bold text-purple-700">
              {loading ? '—' : stats?.totalCategories ?? 0}
            </span>
            <span className="text-xs text-surface-400">categories</span>
          </div>
          <div className="mt-3 text-xs text-purple-600 flex items-center justify-between font-medium">
            <span>{stats?.totalSlaPolicies ?? 0} SLA Matrix rules</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </Link>

        {/* System Health Status */}
        <div className="card p-5 bg-white border border-surface-200 shadow-sm rounded-xl">
          <div className="flex items-center justify-between text-surface-500 text-sm font-medium">
            <span>System Status</span>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-emerald-600">
              {loading ? '—' : stats?.systemStatus ?? 'OPERATIONAL'}
            </span>
          </div>
          <div className="mt-3 text-xs text-emerald-700 flex items-center space-x-1 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>All microservices online</span>
          </div>
        </div>
      </div>

      {/* Module Shortcuts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          to="/admin/users"
          className="card p-6 bg-white border border-surface-200 rounded-xl hover:shadow-md transition-all group flex flex-col justify-between"
        >
          <div>
            <div className="w-10 h-10 rounded-lg bg-brand-50 text-brand-700 flex items-center justify-center mb-3">
              <Users className="w-5 h-5" />
            </div>
            <h2 className="text-base font-bold text-surface-900 group-hover:text-brand-600 transition-colors">
              User Account Provisioning
            </h2>
            <p className="text-xs text-surface-500 mt-1 leading-relaxed">
              Create and manage Student, Faculty Handler, HOD, and Administrator accounts. Set departments, reset passwords, and toggle account activation.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-surface-100 flex items-center text-xs font-semibold text-brand-600">
            <span>Open User Directory</span>
            <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        <Link
          to="/admin/categories"
          className="card p-6 bg-white border border-surface-200 rounded-xl hover:shadow-md transition-all group flex flex-col justify-between"
        >
          <div>
            <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center mb-3">
              <Settings className="w-5 h-5" />
            </div>
            <h2 className="text-base font-bold text-surface-900 group-hover:text-purple-600 transition-colors">
              Category Catalog & SLA Thresholds
            </h2>
            <p className="text-xs text-surface-500 mt-1 leading-relaxed">
              Configure issue categories and define target response and resolution turnaround hours across Critical, High, Medium, and Low priorities.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-surface-100 flex items-center text-xs font-semibold text-purple-600">
            <span>Configure SLA Matrix</span>
            <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        <Link
          to="/admin/audit"
          className="card p-6 bg-white border border-surface-200 rounded-xl hover:shadow-md transition-all group flex flex-col justify-between"
        >
          <div>
            <div className="w-10 h-10 rounded-lg bg-surface-100 text-surface-700 flex items-center justify-center mb-3">
              <Layers className="w-5 h-5" />
            </div>
            <h2 className="text-base font-bold text-surface-900 group-hover:text-surface-800 transition-colors">
              Security Audit Event Trail
            </h2>
            <p className="text-xs text-surface-500 mt-1 leading-relaxed">
              Inspect full lifecycle chronological audit logs. Filter state changes, reassignment records, supervisor rejections, and SLA escalation events.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-surface-100 flex items-center text-xs font-semibold text-surface-700">
            <span>Explore Audit Records</span>
            <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>
      </div>

      {/* Institutional Analytics Summary (if available) */}
      {analytics && (
        <div className="card p-6 bg-white border border-surface-200 rounded-xl shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-surface-100 pb-3">
            <div>
              <h2 className="text-base font-bold text-surface-900 flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-brand-600" />
                <span>Campus-Wide Operational Performance</span>
              </h2>
              <p className="text-xs text-surface-500 mt-0.5">
                Aggregated metrics across all academic departments and infrastructure facilities.
              </p>
            </div>
            <Link to="/hod/analytics" className="text-xs font-semibold text-brand-600 hover:underline flex items-center space-x-1">
              <span>View detailed department analytics</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 bg-surface-50 rounded-xl border border-surface-200">
              <span className="text-xs text-surface-500">Institution SLA Compliance</span>
              <div className="text-2xl font-extrabold text-emerald-600 mt-1">
                {(analytics.slaComplianceRate ?? 100).toFixed(1)}%
              </div>
              <span className="text-[11px] text-surface-400">Target: ≥ 95%</span>
            </div>

            <div className="p-4 bg-surface-50 rounded-xl border border-surface-200">
              <span className="text-xs text-surface-500">Mean Turnaround (MTTR)</span>
              <div className="text-2xl font-extrabold text-brand-600 mt-1 flex items-baseline space-x-1">
                <span>{(analytics.averageResolutionHours ?? 0).toFixed(1)}</span>
                <span className="text-xs font-normal text-surface-500">hrs</span>
              </div>
              <span className="text-[11px] text-surface-400">Creation to resolution</span>
            </div>

            <div className="p-4 bg-surface-50 rounded-xl border border-surface-200">
              <span className="text-xs text-surface-500">Active Workload</span>
              <div className="text-2xl font-extrabold text-amber-600 mt-1">
                {(analytics.openIssues || 0) + (analytics.inProgressIssues || 0)}
              </div>
              <span className="text-[11px] text-surface-400">In handlers pipeline</span>
            </div>

            <div className="p-4 bg-surface-50 rounded-xl border border-surface-200">
              <span className="text-xs text-surface-500">Overdue Breaches</span>
              <div className="text-2xl font-extrabold text-rose-600 mt-1">
                {analytics.overdueIssues ?? 0}
              </div>
              <span className="text-[11px] text-rose-500 font-medium">Requires supervisor action</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default AdminDashboardPage;
