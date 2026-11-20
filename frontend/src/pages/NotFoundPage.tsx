import React from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, Home } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="text-center py-20 max-w-md mx-auto">
      <div className="w-16 h-16 mx-auto rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mb-4">
        <AlertCircle className="w-8 h-8" />
      </div>
      <h1 className="text-3xl font-extrabold text-surface-900">404 - Page Not Found</h1>
      <p className="text-sm text-surface-500 mt-2">
        The requested URL was not found on this platform.
      </p>
      <div className="mt-6">
        <Link to="/" className="btn-primary">
          <Home className="w-4 h-4 mr-2" />
          <span>Return Home</span>
        </Link>
      </div>
    </div>
  );
};
