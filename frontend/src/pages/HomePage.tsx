import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';

export const HomePage: React.FC = () => {
  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-surface-900 via-brand-950 to-surface-900 text-white p-8 sm:p-12 lg:p-16 shadow-2xl border border-surface-800">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.15),transparent_50%)]" />
        <div className="relative z-10 max-w-3xl space-y-6">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Centralized Digital Campus Issue Resolution</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight">
            CampusCare Platform
          </h1>

          <p className="text-surface-300 text-base sm:text-lg leading-relaxed max-w-2xl">
            Streamlining campus reporting from submission to verification. Centralize academic, infrastructure, IT, and laboratory issues with automated category routing, SLA tracking, and audit transparency.
          </p>

          <div className="pt-2 flex flex-wrap gap-3">
            <Link to="/register" className="btn-primary !bg-brand-500 hover:!bg-brand-600 !px-6 !py-3 text-sm">
              <span>Get Started</span>
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
            <Link to="/login" className="btn-secondary !bg-surface-800/80 !text-surface-100 !border-surface-700 hover:!bg-surface-800 !px-6 !py-3 text-sm">
              <span>Sign In to Dashboard</span>
            </Link>
          </div>
        </div>
      </section>

      {/* 4 Roles Overview */}
      <section className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold text-surface-900">Role-Specific Workflows</h2>
          <p className="text-sm text-surface-500">
            CampusCare isolates permissions and views strictly based on authenticated responsibilities.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Student Card */}
          <div className="card-premium p-5 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                ST
              </div>
              <h4 className="font-bold text-surface-900">Student Role</h4>
              <p className="text-xs text-surface-500 leading-relaxed">
                Report issues with photos, track live status timeline, communicate with handlers, and confirm resolution or request reopening.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-surface-100 flex items-center text-xs text-brand-600 font-semibold">
              <span>Reporter & Verifier</span>
            </div>
          </div>

          {/* Faculty Card */}
          <div className="card-premium p-5 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-9 h-9 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                FA
              </div>
              <h4 className="font-bold text-surface-900">Faculty / Handler</h4>
              <p className="text-xs text-surface-500 leading-relaxed">
                Acknowledge assignments, update progress, add internal staff notes, propose remediation, and attach resolution proof.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-surface-100 flex items-center text-xs text-purple-600 font-semibold">
              <span>Remediation Specialist</span>
            </div>
          </div>

          {/* HOD Card */}
          <div className="card-premium p-5 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                HD
              </div>
              <h4 className="font-bold text-surface-900">Head of Dept (HOD)</h4>
              <p className="text-xs text-surface-500 leading-relaxed">
                Monitor all departmental complaints, manage category routing rules, reassign/escalate issues, and export CSV reports.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-surface-100 flex items-center text-xs text-amber-600 font-semibold">
              <span>Department Supervisor</span>
            </div>
          </div>

          {/* Admin Card */}
          <div className="card-premium p-5 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                AD
              </div>
              <h4 className="font-bold text-surface-900">Administrator</h4>
              <p className="text-xs text-surface-500 leading-relaxed">
                Platform-wide control: Provision user accounts, manage departments, categories, SLA hour policies, and system audit logs.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-surface-100 flex items-center text-xs text-emerald-600 font-semibold">
              <span>Platform Governance</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
