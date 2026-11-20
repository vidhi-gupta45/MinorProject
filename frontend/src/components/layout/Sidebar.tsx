import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Home,
  FilePlus,
  ListOrdered,
  CheckSquare,
  BarChart3,
  GitPullRequest,
  Users,
  Settings,
  Bell,
  Shield,
  Layers,
} from 'lucide-react';
import type { UserRole } from '../../types';

interface SidebarProps {
  currentRole?: UserRole;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentRole = 'ROLE_STUDENT' }) => {
  const studentLinks = [
    { name: 'Dashboard', to: '/student', icon: Home },
    { name: 'Report Issue', to: '/student/report', icon: FilePlus },
    { name: 'My Issues', to: '/student/issues', icon: ListOrdered },
    { name: 'Notifications', to: '/notifications', icon: Bell },
  ];

  const handlerLinks = [
    { name: 'Handler Overview', to: '/handler', icon: Home },
    { name: 'Assigned Issues', to: '/handler/issues', icon: CheckSquare },
    { name: 'My Workload', to: '/handler/workload', icon: BarChart3 },
    { name: 'Notifications', to: '/notifications', icon: Bell },
  ];

  const hodLinks = [
    { name: 'Dept Overview', to: '/hod', icon: Home },
    { name: 'Department Issues', to: '/hod/issues', icon: Layers },
    { name: 'Routing Rules', to: '/hod/routing', icon: GitPullRequest },
    { name: 'Dept Analytics', to: '/hod/analytics', icon: BarChart3 },
    { name: 'Notifications', to: '/notifications', icon: Bell },
  ];

  const adminLinks = [
    { name: 'Admin Console', to: '/admin', icon: Shield },
    { name: 'User Management', to: '/admin/users', icon: Users },
    { name: 'Category & SLA', to: '/admin/categories', icon: Settings },
    { name: 'Audit Logs', to: '/admin/audit', icon: Layers },
  ];

  let links = studentLinks;
  if (currentRole === 'ROLE_FACULTY') links = handlerLinks;
  if (currentRole === 'ROLE_HOD') links = hodLinks;
  if (currentRole === 'ROLE_ADMIN') links = adminLinks;

  return (
    <aside className="w-64 bg-white border-r border-surface-200 min-h-[calc(100vh-4rem)] p-4 flex flex-col justify-between">
      <div>
        <div className="px-3 py-2 text-xs font-semibold text-surface-400 uppercase tracking-wider">
          Navigation
        </div>
        <nav className="space-y-1 mt-2">
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === '/student' || link.to === '/handler' || link.to === '/hod' || link.to === '/admin'}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-brand-50 text-brand-700 font-semibold'
                      : 'text-surface-600 hover:text-surface-900 hover:bg-surface-50'
                  }`
                }
              >
                <Icon className="w-4 h-4 text-surface-400 group-hover:text-surface-600" />
                <span>{link.name}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      <div className="p-3 bg-surface-50 rounded-xl border border-surface-200">
        <div className="flex items-center space-x-2">
          <Shield className="w-4 h-4 text-brand-600" />
          <span className="text-xs font-semibold text-surface-700">Role View</span>
        </div>
        <p className="text-[11px] text-surface-500 mt-1 capitalize">
          {currentRole.replace('ROLE_', '').toLowerCase()} Dashboard
        </p>
      </div>
    </aside>
  );
};
