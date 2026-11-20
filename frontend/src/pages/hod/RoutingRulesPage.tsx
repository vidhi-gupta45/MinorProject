import React, { useEffect, useState, useCallback } from 'react';
import {
  GitPullRequest,
  CheckCircle2,
  Edit2,
  X,
  Users,
} from 'lucide-react';
import {
  getDepartmentRoutingRules,
  updateRoutingRule,
  getDepartmentHandlers,
} from '../../api/hod';
import type { RoutingRuleDto, User } from '../../types';

export const RoutingRulesPage: React.FC = () => {
  const [rules, setRules] = useState<RoutingRuleDto[]>([]);
  const [handlers, setHandlers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Edit Modal State
  const [editingRule, setEditingRule] = useState<RoutingRuleDto | null>(null);
  const [selectedAssigneeId, setSelectedAssigneeId] = useState<number | ''>('');
  const [updating, setUpdating] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [rulesData, handlersData] = await Promise.all([
        getDepartmentRoutingRules(),
        getDepartmentHandlers(),
      ]);
      setRules(rulesData);
      setHandlers(handlersData);
    } catch (err) {
      console.error('Failed to load routing rules', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRule || !selectedAssigneeId) return;

    setUpdating(true);
    setUpdateError(null);
    try {
      await updateRoutingRule(editingRule.id, Number(selectedAssigneeId));
      setActionSuccess(`Default coordinator for category '${editingRule.categoryName}' updated.`);
      setEditingRule(null);
      setSelectedAssigneeId('');
      loadData();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Failed to update routing rule.';
      setUpdateError(msg);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-surface-900 flex items-center space-x-2">
          <GitPullRequest className="w-6 h-6 text-brand-600" />
          <span>Category Routing Configuration</span>
        </h1>
        <p className="text-xs text-surface-500">
          Automate issue routing by assigning default faculty coordinators for each category
        </p>
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

      {/* Rules Table */}
      <div className="card-premium overflow-hidden">
        <div className="p-4 border-b border-surface-100 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Users className="w-4 h-4 text-purple-600" />
            <h2 className="text-sm font-bold text-surface-900">Active Department Routing Rules</h2>
          </div>
          <span className="text-xs text-surface-400 font-mono">{rules.length} configured</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-50 border-b border-surface-200 text-surface-600 uppercase font-semibold">
              <tr>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Assigned Coordinator</th>
                <th className="px-4 py-3">Coordinator Email</th>
                <th className="px-4 py-3">Priority Rule</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-surface-400">
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-4 h-4 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
                      <span>Loading routing configurations...</span>
                    </div>
                  </td>
                </tr>
              ) : rules.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-surface-400">
                    No routing rules configured for this department. Issues will remain in the unassigned queue.
                  </td>
                </tr>
              ) : (
                rules.map((rule) => (
                  <tr key={rule.id} className="hover:bg-surface-50/70 transition-colors">
                    <td className="px-4 py-3 font-semibold text-surface-900">{rule.categoryName}</td>
                    <td className="px-4 py-3 font-mono text-surface-500">{rule.categoryCode}</td>
                    <td className="px-4 py-3 font-medium text-surface-800">{rule.assigneeName}</td>
                    <td className="px-4 py-3 font-mono text-[11px] text-surface-400">{rule.assigneeEmail}</td>
                    <td className="px-4 py-3">
                      <span className="badge bg-surface-100 text-surface-700 font-mono text-[10px]">
                        {rule.priorityCondition}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="badge bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px]">
                        Active
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => {
                          setEditingRule(rule);
                          setSelectedAssigneeId(rule.assigneeId);
                          setUpdateError(null);
                        }}
                        className="btn-secondary !py-1 !px-2.5 text-xs inline-flex items-center space-x-1"
                      >
                        <Edit2 className="w-3 h-3" />
                        <span>Edit</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Rule Modal */}
      {editingRule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface-950/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-surface-200">
            <div className="flex items-center justify-between border-b border-surface-100 pb-3">
              <div className="flex items-center space-x-2">
                <Edit2 className="w-5 h-5 text-brand-600" />
                <h3 className="text-base font-bold text-surface-900">Edit Category Assignment</h3>
              </div>
              <button onClick={() => setEditingRule(null)} className="text-surface-400 hover:text-surface-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs bg-surface-50 p-3 rounded-lg border border-surface-200 space-y-1">
              <div className="font-bold text-surface-900">{editingRule.categoryName}</div>
              <div className="text-surface-500">Currently assigned to: {editingRule.assigneeName}</div>
            </div>

            {updateError && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                {updateError}
              </div>
            )}

            <form onSubmit={handleUpdateSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-surface-700">
                  Select New Default Coordinator <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={selectedAssigneeId}
                  onChange={(e) => setSelectedAssigneeId(e.target.value ? Number(e.target.value) : '')}
                  className="input-field text-xs w-full"
                >
                  <option value="">-- Choose Coordinator --</option>
                  {handlers.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.fullName} ({h.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-surface-100">
                <button
                  type="button"
                  onClick={() => setEditingRule(null)}
                  className="btn-secondary !py-2 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating || !selectedAssigneeId}
                  className="btn-primary !py-2 text-xs"
                >
                  <span>{updating ? 'Updating...' : 'Save Configuration'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
