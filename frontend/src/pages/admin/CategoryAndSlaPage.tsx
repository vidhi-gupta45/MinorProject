import React, { useEffect, useState, useCallback } from 'react';
import {
  Settings,
  Plus,
  RefreshCw,
  Edit2,
  CheckCircle2,
  XCircle,
  X,
  Clock,
  Layers,
  AlertTriangle,
} from 'lucide-react';
import {
  getAllCategories,
  createCategory,
  updateCategory,
  getAllSlaPolicies,
  updateSlaPolicy,
} from '../../api/admin';
import type {
  CategoryAdminDto,
  CreateCategoryRequest,
  UpdateCategoryRequest,
  SlaPolicyDto,
  UpdateSlaPolicyRequest,
} from '../../types';

export const CategoryAndSlaPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'categories' | 'sla'>('categories');
  const [categories, setCategories] = useState<CategoryAdminDto[]>([]);
  const [slaPolicies, setSlaPolicies] = useState<SlaPolicyDto[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showAddCatModal, setShowAddCatModal] = useState(false);
  const [showEditCatModal, setShowEditCatModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<CategoryAdminDto | null>(null);

  const [showEditSlaModal, setShowEditSlaModal] = useState(false);
  const [selectedSla, setSelectedSla] = useState<SlaPolicyDto | null>(null);

  // Form states
  const [catForm, setCatForm] = useState<CreateCategoryRequest>({
    code: '',
    name: '',
    description: '',
  });

  const [editCatForm, setEditCatForm] = useState<UpdateCategoryRequest>({
    name: '',
    description: '',
    active: true,
  });

  const [slaForm, setSlaForm] = useState<UpdateSlaPolicyRequest>({
    responseTargetHours: 12,
    resolutionTargetHours: 48,
    active: true,
  });

  const [submitting, setSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [cats, slas] = await Promise.all([
        getAllCategories(),
        getAllSlaPolicies(),
      ]);
      setCategories(cats);
      setSlaPolicies(slas);
    } catch (err) {
      console.error('Failed to load category/SLA data', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await createCategory(catForm);
      showToast('Category created with default SLA policies!');
      setShowAddCatModal(false);
      setCatForm({ code: '', name: '', description: '' });
      loadData();
    } catch (err) {
      console.error('Failed to create category', err);
      alert('Failed to create category. Please ensure code is unique and uppercase.');
    } finally {
      setSubmitting(false);
    }
  };

  const openEditCatModal = (cat: CategoryAdminDto) => {
    setSelectedCategory(cat);
    setEditCatForm({
      name: cat.name,
      description: cat.description || '',
      active: cat.active,
    });
    setShowEditCatModal(true);
  };

  const handleEditCategory = async (e: React.FormEvent) => {
    if (!selectedCategory) return;
    e.preventDefault();
    setSubmitting(true);
    try {
      await updateCategory(selectedCategory.id, editCatForm);
      showToast('Category updated successfully!');
      setShowEditCatModal(false);
      loadData();
    } catch (err) {
      console.error('Failed to update category', err);
      alert('Failed to update category.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleCatStatus = async (cat: CategoryAdminDto) => {
    try {
      await updateCategory(cat.id, {
        name: cat.name,
        description: cat.description,
        active: !cat.active,
      });
      showToast(`Category ${!cat.active ? 'activated' : 'deactivated'}.`);
      loadData();
    } catch (err) {
      console.error('Failed to toggle status', err);
    }
  };

  const openEditSlaModal = (policy: SlaPolicyDto) => {
    setSelectedSla(policy);
    setSlaForm({
      responseTargetHours: policy.responseTargetHours,
      resolutionTargetHours: policy.resolutionTargetHours,
      active: policy.active,
    });
    setShowEditSlaModal(true);
  };

  const handleEditSlaSubmit = async (e: React.FormEvent) => {
    if (!selectedSla) return;
    e.preventDefault();
    setSubmitting(true);
    try {
      await updateSlaPolicy(selectedSla.id, slaForm);
      showToast('SLA policy targets updated successfully!');
      setShowEditSlaModal(false);
      loadData();
    } catch (err) {
      console.error('Failed to update SLA policy', err);
      alert('Failed to update SLA policy.');
    } finally {
      setSubmitting(false);
    }
  };

  const getPriorityBadge = (prio: string) => {
    switch (prio) {
      case 'CRITICAL':
        return <span className="badge bg-rose-50 text-rose-700 border border-rose-200">Critical (P1)</span>;
      case 'HIGH':
        return <span className="badge bg-orange-50 text-orange-700 border border-orange-200">High (P2)</span>;
      case 'MEDIUM':
        return <span className="badge bg-amber-50 text-amber-700 border border-amber-200">Medium (P3)</span>;
      case 'LOW':
        return <span className="badge bg-emerald-50 text-emerald-700 border border-emerald-200">Low (P4)</span>;
      default:
        return <span className="badge">{prio}</span>;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-xl bg-emerald-600 text-white shadow-lg flex items-center space-x-2 animate-bounce">
          <CheckCircle2 className="w-5 h-5" />
          <span className="text-sm font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-surface-200 pb-5">
        <div>
          <div className="flex items-center space-x-2">
            <span className="badge bg-purple-50 text-purple-700 border border-purple-200 text-xs">
              Service Catalog & SLA
            </span>
            <span className="text-surface-400 text-xs">
              • {categories.length} Categories • {slaPolicies.length} Threshold Rules
            </span>
          </div>
          <h1 className="text-2xl font-bold text-surface-900 tracking-tight mt-1 flex items-center space-x-2">
            <Settings className="w-6 h-6 text-purple-600" />
            <span>Category & SLA Policy Governance</span>
          </h1>
          <p className="text-sm text-surface-500 mt-1">
            Configure campus issue categories and enforce maximum response and resolution turnaround hours.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={loadData}
            disabled={loading}
            className="btn btn-secondary flex items-center space-x-2 text-sm"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <button
            onClick={() => setShowAddCatModal(true)}
            className="btn btn-primary flex items-center space-x-2 text-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Add Category</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 border-b border-surface-200">
        <button
          onClick={() => setActiveTab('categories')}
          className={`pb-3 px-4 text-sm font-bold border-b-2 flex items-center space-x-2 transition-colors ${
            activeTab === 'categories'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-surface-500 hover:text-surface-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Categories Directory ({categories.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('sla')}
          className={`pb-3 px-4 text-sm font-bold border-b-2 flex items-center space-x-2 transition-colors ${
            activeTab === 'sla'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-surface-500 hover:text-surface-800'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>SLA Policies Matrix ({slaPolicies.length})</span>
        </button>
      </div>

      {/* Tab 1: Categories Directory */}
      {activeTab === 'categories' && (
        <div className="card bg-white border border-surface-200 rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-50 border-b border-surface-200 text-xs font-semibold text-surface-600">
                  <th className="py-3 px-4">Category Code</th>
                  <th className="py-3 px-4">Display Name</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100 text-sm">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-surface-400">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-brand-600" />
                      <span>Loading categories...</span>
                    </td>
                  </tr>
                ) : (
                  categories.map((cat) => (
                    <tr key={cat.id} className="hover:bg-surface-50 transition-colors">
                      <td className="py-3 px-4 font-mono text-xs font-bold text-surface-800">
                        {cat.code}
                      </td>
                      <td className="py-3 px-4 font-semibold text-surface-900">{cat.name}</td>
                      <td className="py-3 px-4 text-xs text-surface-500 max-w-xs truncate" title={cat.description}>
                        {cat.description || '—'}
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => handleToggleCatStatus(cat)}
                          className={`inline-flex items-center space-x-1.5 px-2 py-0.5 rounded-full text-xs font-medium border transition-colors ${
                            cat.active
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                              : 'bg-surface-100 text-surface-500 border-surface-200 hover:bg-surface-200'
                          }`}
                        >
                          {cat.active ? (
                            <>
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>Active</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3 h-3 text-surface-400" />
                              <span>Inactive</span>
                            </>
                          )}
                        </button>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => openEditCatModal(cat)}
                          className="p-1.5 rounded-lg text-surface-500 hover:text-brand-600 hover:bg-surface-100 transition-colors"
                          title="Edit category"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: SLA Policies Matrix */}
      {activeTab === 'sla' && (
        <div className="space-y-4">
          <div className="p-4 bg-purple-50 border border-purple-200 rounded-xl text-xs text-purple-900 flex items-start space-x-2">
            <AlertTriangle className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
            <p>
              <strong>SLA Turnaround Engine:</strong> When an issue is filed, resolution deadlines are automatically computed based on the Category and Priority tier targets below. Automated schedulers escalate overdue issues to HODs when these thresholds expire.
            </p>
          </div>

          <div className="card bg-white border border-surface-200 rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-50 border-b border-surface-200 text-xs font-semibold text-surface-600">
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Priority Tier</th>
                    <th className="py-3 px-4">Response Target</th>
                    <th className="py-3 px-4">Resolution Target</th>
                    <th className="py-3 px-4">Policy Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-100 text-sm">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-surface-400">
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-purple-600" />
                        <span>Loading SLA policies...</span>
                      </td>
                    </tr>
                  ) : slaPolicies.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-surface-400">
                        No SLA policies configured yet.
                      </td>
                    </tr>
                  ) : (
                    slaPolicies.map((sla) => (
                      <tr key={sla.id} className="hover:bg-surface-50 transition-colors">
                        <td className="py-3 px-4">
                          <span className="font-semibold text-surface-900">{sla.categoryName}</span>
                          <span className="ml-2 font-mono text-[10px] text-surface-400">({sla.categoryCode})</span>
                        </td>
                        <td className="py-3 px-4">{getPriorityBadge(sla.priority)}</td>
                        <td className="py-3 px-4">
                          <span className="font-bold text-surface-800">{sla.responseTargetHours} hrs</span>
                          <span className="text-xs text-surface-400 ml-1">acknowledgment</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-bold text-surface-800">{sla.resolutionTargetHours} hrs</span>
                          <span className="text-xs text-surface-400 ml-1">
                            ({(sla.resolutionTargetHours / 24).toFixed(1)} days)
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {sla.active ? (
                            <span className="inline-flex items-center text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                              Enforced
                            </span>
                          ) : (
                            <span className="inline-flex items-center text-xs font-medium text-surface-500 bg-surface-100 px-2 py-0.5 rounded-full">
                              Disabled
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => openEditSlaModal(sla)}
                            className="btn btn-secondary !py-1 !px-2.5 text-xs flex items-center space-x-1 ml-auto"
                            title="Edit SLA threshold hours"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            <span>Edit Target</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Create Category */}
      {showAddCatModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="card p-6 bg-white border border-surface-200 rounded-2xl shadow-xl max-w-md w-full animate-fadeIn">
            <div className="flex items-center justify-between border-b border-surface-100 pb-3">
              <h3 className="font-bold text-base text-surface-900 flex items-center space-x-2">
                <Plus className="w-5 h-5 text-brand-600" />
                <span>Create Issue Category</span>
              </h3>
              <button onClick={() => setShowAddCatModal(false)} className="text-surface-400 hover:text-surface-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCategory} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="block font-semibold text-surface-700 mb-1">Category Code</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SECURITY_SURVEILLANCE"
                  value={catForm.code}
                  onChange={(e) => setCatForm({ ...catForm, code: e.target.value.toUpperCase() })}
                  className="input font-mono text-sm w-full"
                />
                <p className="text-[11px] text-surface-400 mt-1">Uppercase letters and underscores only (3-50 chars)</p>
              </div>

              <div>
                <label className="block font-semibold text-surface-700 mb-1">Display Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CCTV & Campus Security"
                  value={catForm.name}
                  onChange={(e) => setCatForm({ ...catForm, name: e.target.value })}
                  className="input text-sm w-full"
                />
              </div>

              <div>
                <label className="block font-semibold text-surface-700 mb-1">Description</label>
                <textarea
                  rows={3}
                  placeholder="Describe scope, covered equipment, or responsible teams..."
                  value={catForm.description || ''}
                  onChange={(e) => setCatForm({ ...catForm, description: e.target.value })}
                  className="input text-sm w-full"
                />
              </div>

              <div className="p-3 bg-purple-50 rounded-lg border border-purple-200 text-[11px] text-purple-900">
                Default SLA turnaround rules (Critical: 8h, High: 24h, Medium: 48h, Low: 96h) will be automatically created.
              </div>

              <div className="pt-3 border-t border-surface-100 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddCatModal(false)}
                  className="btn btn-secondary text-sm"
                >
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="btn btn-primary text-sm">
                  {submitting ? 'Creating...' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Category */}
      {showEditCatModal && selectedCategory && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="card p-6 bg-white border border-surface-200 rounded-2xl shadow-xl max-w-md w-full animate-fadeIn">
            <div className="flex items-center justify-between border-b border-surface-100 pb-3">
              <h3 className="font-bold text-base text-surface-900 flex items-center space-x-2">
                <Edit2 className="w-5 h-5 text-brand-600" />
                <span>Edit Category: {selectedCategory.code}</span>
              </h3>
              <button onClick={() => setShowEditCatModal(false)} className="text-surface-400 hover:text-surface-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditCategory} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="block font-semibold text-surface-700 mb-1">Display Name</label>
                <input
                  type="text"
                  required
                  value={editCatForm.name}
                  onChange={(e) => setEditCatForm({ ...editCatForm, name: e.target.value })}
                  className="input text-sm w-full"
                />
              </div>

              <div>
                <label className="block font-semibold text-surface-700 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={editCatForm.description || ''}
                  onChange={(e) => setEditCatForm({ ...editCatForm, description: e.target.value })}
                  className="input text-sm w-full"
                />
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="catActiveCheck"
                  checked={editCatForm.active ?? true}
                  onChange={(e) => setEditCatForm({ ...editCatForm, active: e.target.checked })}
                  className="rounded text-brand-600 focus:ring-brand-500 h-4 w-4"
                />
                <label htmlFor="catActiveCheck" className="text-surface-700 font-medium">
                  Category is Active for Student Issue Reporting
                </label>
              </div>

              <div className="pt-3 border-t border-surface-100 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowEditCatModal(false)}
                  className="btn btn-secondary text-sm"
                >
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="btn btn-primary text-sm">
                  {submitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit SLA Policy Target */}
      {showEditSlaModal && selectedSla && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="card p-6 bg-white border border-surface-200 rounded-2xl shadow-xl max-w-md w-full animate-fadeIn">
            <div className="flex items-center justify-between border-b border-surface-100 pb-3">
              <h3 className="font-bold text-base text-surface-900 flex items-center space-x-2">
                <Clock className="w-5 h-5 text-purple-600" />
                <span>Edit SLA Threshold</span>
              </h3>
              <button onClick={() => setShowEditSlaModal(false)} className="text-surface-400 hover:text-surface-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSlaSubmit} className="space-y-4 mt-4 text-xs">
              <div className="p-3 bg-surface-50 rounded-lg border border-surface-200">
                <div className="text-surface-500">Category & Priority Tier:</div>
                <div className="font-bold text-surface-900 text-sm mt-0.5">
                  {selectedSla.categoryName} — {selectedSla.priority}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-surface-700 mb-1">
                  Response Target Hours (Acknowledgment Deadline)
                </label>
                <input
                  type="number"
                  min={1}
                  required
                  value={slaForm.responseTargetHours}
                  onChange={(e) => setSlaForm({ ...slaForm, responseTargetHours: Number(e.target.value) })}
                  className="input text-sm w-full"
                />
                <p className="text-[11px] text-surface-400 mt-1">Maximum hours before handler acknowledgment is overdue</p>
              </div>

              <div>
                <label className="block font-semibold text-surface-700 mb-1">
                  Resolution Target Hours (Fix & Verification Deadline)
                </label>
                <input
                  type="number"
                  min={1}
                  required
                  value={slaForm.resolutionTargetHours}
                  onChange={(e) => setSlaForm({ ...slaForm, resolutionTargetHours: Number(e.target.value) })}
                  className="input text-sm w-full"
                />
                <p className="text-[11px] text-surface-400 mt-1">
                  {(slaForm.resolutionTargetHours / 24).toFixed(1)} days before SLA escalation fires
                </p>
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="slaActiveCheck"
                  checked={slaForm.active ?? true}
                  onChange={(e) => setSlaForm({ ...slaForm, active: e.target.checked })}
                  className="rounded text-brand-600 focus:ring-brand-500 h-4 w-4"
                />
                <label htmlFor="slaActiveCheck" className="text-surface-700 font-medium">
                  SLA Policy is Active & Enforced
                </label>
              </div>

              <div className="pt-3 border-t border-surface-100 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowEditSlaModal(false)}
                  className="btn btn-secondary text-sm"
                >
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="btn btn-primary text-sm">
                  {submitting ? 'Saving...' : 'Save Targets'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default CategoryAndSlaPage;
