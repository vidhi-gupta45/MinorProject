import React, { useEffect, useState, useCallback } from 'react';
import {
  Users,
  Search,
  UserPlus,
  RefreshCw,
  Edit2,
  KeyRound,
  CheckCircle2,
  XCircle,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { getUsers, createUser, updateUser, resetUserPassword } from '../../api/admin';
import { getDepartments } from '../../api/auth';
import type {
  AdminUserDto,
  CreateUserRequest,
  UpdateUserRequest,
  Department,
  UserRole,
} from '../../types';

export const UserManagementPage: React.FC = () => {
  const [users, setUsers] = useState<AdminUserDto[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);

  // Filters
  const [roleFilter, setRoleFilter] = useState<UserRole | ''>('');
  const [deptFilter, setDeptFilter] = useState<number | ''>('');
  const [activeFilter, setActiveFilter] = useState<string>('');
  const [search, setSearch] = useState('');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUserDto | null>(null);

  // Form states
  const [createForm, setCreateForm] = useState<CreateUserRequest>({
    fullName: '',
    email: '',
    password: '',
    role: 'ROLE_FACULTY',
    departmentId: undefined,
    phoneNumber: '',
  });

  const [editForm, setEditForm] = useState<UpdateUserRequest>({
    fullName: '',
    role: 'ROLE_FACULTY',
    departmentId: undefined,
    phoneNumber: '',
    active: true,
  });

  const [newPassword, setNewPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const activeParam = activeFilter === 'true' ? true : activeFilter === 'false' ? false : undefined;
      const res = await getUsers({
        role: roleFilter || undefined,
        departmentId: deptFilter || undefined,
        active: activeParam,
        search: search.trim() || undefined,
        page,
        size: 10,
      });
      setUsers(res.content);
      setTotalPages(res.totalPages);
      setTotalElements(res.totalElements);
    } catch (err) {
      console.error('Failed to load users', err);
    } finally {
      setLoading(false);
    }
  }, [roleFilter, deptFilter, activeFilter, search, page]);

  useEffect(() => {
    getDepartments().then(setDepartments).catch(console.error);
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await createUser(createForm);
      showToast('User provisioned successfully!');
      setShowCreateModal(false);
      setCreateForm({
        fullName: '',
        email: '',
        password: '',
        role: 'ROLE_FACULTY',
        departmentId: undefined,
        phoneNumber: '',
      });
      loadUsers();
    } catch (err) {
      console.error('Failed to create user', err);
      alert('Failed to provision user. Please verify email uniqueness.');
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = (user: AdminUserDto) => {
    setSelectedUser(user);
    setEditForm({
      fullName: user.fullName,
      role: user.role,
      departmentId: user.departmentId,
      phoneNumber: user.phoneNumber || '',
      active: user.active,
    });
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    if (!selectedUser) return;
    e.preventDefault();
    setSubmitting(true);
    try {
      await updateUser(selectedUser.id, editForm);
      showToast('User updated successfully!');
      setShowEditModal(false);
      loadUsers();
    } catch (err) {
      console.error('Failed to update user', err);
      alert('Failed to update user profile.');
    } finally {
      setSubmitting(false);
    }
  };

  const openPasswordModal = (user: AdminUserDto) => {
    setSelectedUser(user);
    setNewPassword('');
    setShowPasswordModal(true);
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    if (!selectedUser) return;
    e.preventDefault();
    if (newPassword.length < 6) {
      alert('Password must be at least 6 characters.');
      return;
    }
    setSubmitting(true);
    try {
      await resetUserPassword(selectedUser.id, newPassword);
      showToast(`Password reset for ${selectedUser.fullName}!`);
      setShowPasswordModal(false);
    } catch (err) {
      console.error('Failed to reset password', err);
      alert('Failed to reset password.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (user: AdminUserDto) => {
    try {
      await updateUser(user.id, {
        fullName: user.fullName,
        role: user.role,
        departmentId: user.departmentId,
        phoneNumber: user.phoneNumber,
        active: !user.active,
      });
      showToast(`User ${!user.active ? 'activated' : 'deactivated'} successfully.`);
      loadUsers();
    } catch (err) {
      console.error('Failed to toggle status', err);
    }
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'ROLE_STUDENT':
        return <span className="badge bg-blue-50 text-blue-700 border border-blue-200">Student</span>;
      case 'ROLE_FACULTY':
        return <span className="badge bg-purple-50 text-purple-700 border border-purple-200">Faculty Handler</span>;
      case 'ROLE_HOD':
        return <span className="badge bg-amber-50 text-amber-800 border border-amber-200">Department HOD</span>;
      case 'ROLE_ADMIN':
        return <span className="badge bg-emerald-50 text-emerald-700 border border-emerald-200">System Admin</span>;
      default:
        return null;
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
            <span className="badge bg-brand-50 text-brand-700 border border-brand-200 text-xs">
              Identity & Access Management
            </span>
            <span className="text-surface-400 text-xs">• {totalElements} Total Accounts</span>
          </div>
          <h1 className="text-2xl font-bold text-surface-900 tracking-tight mt-1 flex items-center space-x-2">
            <Users className="w-6 h-6 text-brand-600" />
            <span>User Account Management</span>
          </h1>
          <p className="text-sm text-surface-500 mt-1">
            Provision faculty handlers, department heads, and students with role and department isolation.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={loadUsers}
            disabled={loading}
            className="btn btn-secondary flex items-center space-x-2 text-sm"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn btn-primary flex items-center space-x-2 text-sm"
          >
            <UserPlus className="w-4 h-4" />
            <span>Provision User</span>
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="card p-4 bg-white border border-surface-200 rounded-xl shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-surface-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            className="input pl-9 text-sm w-full"
          />
        </div>

        {/* Dropdowns */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value as UserRole | '');
              setPage(0);
            }}
            className="input text-xs py-2"
          >
            <option value="">All Roles</option>
            <option value="ROLE_STUDENT">Student</option>
            <option value="ROLE_FACULTY">Faculty Handler</option>
            <option value="ROLE_HOD">HOD</option>
            <option value="ROLE_ADMIN">Administrator</option>
          </select>

          <select
            value={deptFilter}
            onChange={(e) => {
              setDeptFilter(e.target.value ? Number(e.target.value) : '');
              setPage(0);
            }}
            className="input text-xs py-2"
          >
            <option value="">All Departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name} ({d.departmentCode})
              </option>
            ))}
          </select>

          <select
            value={activeFilter}
            onChange={(e) => {
              setActiveFilter(e.target.value);
              setPage(0);
            }}
            className="input text-xs py-2"
          >
            <option value="">All Statuses</option>
            <option value="true">Active Only</option>
            <option value="false">Inactive Only</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="card bg-white border border-surface-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-50 border-b border-surface-200 text-xs font-semibold text-surface-600">
                <th className="py-3 px-4">User Details</th>
                <th className="py-3 px-4">System Role</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Phone</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-surface-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-brand-600" />
                    <span>Loading user accounts...</span>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-surface-400">
                    No users found matching your search criteria.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-surface-50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-surface-900">{u.fullName}</div>
                      <div className="text-xs text-surface-500">{u.email}</div>
                    </td>
                    <td className="py-3 px-4">{getRoleBadge(u.role)}</td>
                    <td className="py-3 px-4">
                      {u.departmentName ? (
                        <span className="text-xs font-medium text-surface-700">{u.departmentName}</span>
                      ) : (
                        <span className="text-xs text-surface-400 italic">Global (Institution)</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-xs text-surface-600">
                      {u.phoneNumber || '—'}
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => handleToggleStatus(u)}
                        className={`inline-flex items-center space-x-1.5 px-2 py-0.5 rounded-full text-xs font-medium border transition-colors ${
                          u.active
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                            : 'bg-surface-100 text-surface-500 border-surface-200 hover:bg-surface-200'
                        }`}
                        title="Click to toggle status"
                      >
                        {u.active ? (
                          <>
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Active</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3 text-surface-400" />
                            <span>Disabled</span>
                          </>
                        )}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center space-x-2">
                        <button
                          onClick={() => openEditModal(u)}
                          className="p-1.5 rounded-lg text-surface-500 hover:text-brand-600 hover:bg-surface-100 transition-colors"
                          title="Edit user details"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openPasswordModal(u)}
                          className="p-1.5 rounded-lg text-surface-500 hover:text-amber-600 hover:bg-surface-100 transition-colors"
                          title="Reset user password"
                        >
                          <KeyRound className="w-4 h-4" />
                        </button>
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
          <div className="p-4 bg-surface-50 border-t border-surface-200 flex items-center justify-between text-xs text-surface-600">
            <span>
              Showing Page {page + 1} of {totalPages} ({totalElements} accounts)
            </span>
            <div className="flex items-center space-x-1">
              <button
                disabled={page === 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                className="btn btn-secondary !py-1 !px-2 text-xs flex items-center space-x-1 disabled:opacity-40"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Prev</span>
              </button>
              <button
                disabled={page >= totalPages - 1}
                onClick={() => setPage((p) => p + 1)}
                className="btn btn-secondary !py-1 !px-2 text-xs flex items-center space-x-1 disabled:opacity-40"
              >
                <span>Next</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal: Create User */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="card p-6 bg-white border border-surface-200 rounded-2xl shadow-xl max-w-md w-full animate-fadeIn">
            <div className="flex items-center justify-between border-b border-surface-100 pb-3">
              <h3 className="font-bold text-base text-surface-900 flex items-center space-x-2">
                <UserPlus className="w-5 h-5 text-brand-600" />
                <span>Provision User Account</span>
              </h3>
              <button onClick={() => setShowCreateModal(false)} className="text-surface-400 hover:text-surface-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="block font-semibold text-surface-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Jane Smith"
                  value={createForm.fullName}
                  onChange={(e) => setCreateForm({ ...createForm, fullName: e.target.value })}
                  className="input text-sm w-full"
                />
              </div>

              <div>
                <label className="block font-semibold text-surface-700 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. jane.smith@campuscare.edu"
                  value={createForm.email}
                  onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                  className="input text-sm w-full"
                />
              </div>

              <div>
                <label className="block font-semibold text-surface-700 mb-1">Temporary Password</label>
                <input
                  type="password"
                  required
                  placeholder="Min 6 characters"
                  value={createForm.password}
                  onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                  className="input text-sm w-full"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-surface-700 mb-1">System Role</label>
                  <select
                    value={createForm.role}
                    onChange={(e) => setCreateForm({ ...createForm, role: e.target.value as UserRole })}
                    className="input text-sm w-full"
                  >
                    <option value="ROLE_STUDENT">Student</option>
                    <option value="ROLE_FACULTY">Faculty Handler</option>
                    <option value="ROLE_HOD">HOD</option>
                    <option value="ROLE_ADMIN">Administrator</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-surface-700 mb-1">Department</label>
                  <select
                    value={createForm.departmentId ?? ''}
                    onChange={(e) =>
                      setCreateForm({
                        ...createForm,
                        departmentId: e.target.value ? Number(e.target.value) : undefined,
                      })
                    }
                    className="input text-sm w-full"
                  >
                    <option value="">None (Global)</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.departmentCode}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-surface-700 mb-1">Phone Number (Optional)</label>
                <input
                  type="tel"
                  placeholder="e.g. 9876543210"
                  value={createForm.phoneNumber || ''}
                  onChange={(e) => setCreateForm({ ...createForm, phoneNumber: e.target.value })}
                  className="input text-sm w-full"
                />
              </div>

              <div className="pt-3 border-t border-surface-100 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn btn-secondary text-sm"
                >
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="btn btn-primary text-sm">
                  {submitting ? 'Creating...' : 'Provision Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit User */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="card p-6 bg-white border border-surface-200 rounded-2xl shadow-xl max-w-md w-full animate-fadeIn">
            <div className="flex items-center justify-between border-b border-surface-100 pb-3">
              <h3 className="font-bold text-base text-surface-900 flex items-center space-x-2">
                <Edit2 className="w-5 h-5 text-brand-600" />
                <span>Edit User Profile</span>
              </h3>
              <button onClick={() => setShowEditModal(false)} className="text-surface-400 hover:text-surface-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="block font-semibold text-surface-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={editForm.fullName}
                  onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                  className="input text-sm w-full"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-surface-700 mb-1">System Role</label>
                  <select
                    value={editForm.role}
                    onChange={(e) => setEditForm({ ...editForm, role: e.target.value as UserRole })}
                    className="input text-sm w-full"
                  >
                    <option value="ROLE_STUDENT">Student</option>
                    <option value="ROLE_FACULTY">Faculty Handler</option>
                    <option value="ROLE_HOD">HOD</option>
                    <option value="ROLE_ADMIN">Administrator</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-surface-700 mb-1">Department</label>
                  <select
                    value={editForm.departmentId ?? ''}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        departmentId: e.target.value ? Number(e.target.value) : undefined,
                      })
                    }
                    className="input text-sm w-full"
                  >
                    <option value="">None (Global)</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.departmentCode}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-surface-700 mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={editForm.phoneNumber || ''}
                  onChange={(e) => setEditForm({ ...editForm, phoneNumber: e.target.value })}
                  className="input text-sm w-full"
                />
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="activeCheck"
                  checked={editForm.active ?? true}
                  onChange={(e) => setEditForm({ ...editForm, active: e.target.checked })}
                  className="rounded text-brand-600 focus:ring-brand-500 h-4 w-4"
                />
                <label htmlFor="activeCheck" className="text-surface-700 font-medium">
                  Account is Active & Permitted to Login
                </label>
              </div>

              <div className="pt-3 border-t border-surface-100 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
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

      {/* Modal: Reset Password */}
      {showPasswordModal && selectedUser && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="card p-6 bg-white border border-surface-200 rounded-2xl shadow-xl max-w-sm w-full animate-fadeIn">
            <div className="flex items-center justify-between border-b border-surface-100 pb-3">
              <h3 className="font-bold text-base text-surface-900 flex items-center space-x-2">
                <KeyRound className="w-5 h-5 text-amber-600" />
                <span>Reset User Password</span>
              </h3>
              <button onClick={() => setShowPasswordModal(false)} className="text-surface-400 hover:text-surface-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePasswordSubmit} className="space-y-4 mt-4 text-xs">
              <p className="text-surface-500">
                Resetting password for <strong>{selectedUser.fullName}</strong> ({selectedUser.email}).
              </p>

              <div>
                <label className="block font-semibold text-surface-700 mb-1">New Password</label>
                <input
                  type="password"
                  required
                  placeholder="Min 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="input text-sm w-full"
                />
              </div>

              <div className="pt-3 border-t border-surface-100 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="btn btn-secondary text-sm"
                >
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="btn btn-primary text-sm">
                  {submitting ? 'Resetting...' : 'Reset Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default UserManagementPage;
