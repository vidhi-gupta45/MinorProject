import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { useAuth } from '../../context/AuthContext';
import type { UserRole } from '../../types';

interface AppLayoutProps {
  showSidebar?: boolean;
  currentRole?: UserRole;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ showSidebar = false, currentRole }) => {
  const { user } = useAuth();
  const effectiveRole = currentRole || user?.role;

  return (
    <div className="min-h-screen flex flex-col bg-surface-50">
      <Navbar />
      <div className="flex-1 flex">
        {showSidebar && <Sidebar currentRole={effectiveRole} />}
        <main className="flex-1 p-6 md:p-8 max-w-7xl mx-auto w-full">
          <Outlet />
        </main>
      </div>
      <footer className="bg-white border-t border-surface-200 py-6 text-center text-xs text-surface-500">
        <p>© 2026 CampusCare — Smart Campus Issue Reporting and Resolution Platform. Built with Spring Boot & React.</p>
      </footer>
    </div>
  );
};
