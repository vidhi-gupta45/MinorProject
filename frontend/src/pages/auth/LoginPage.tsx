import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { ShieldAlert, LogIn, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import type { UserRole } from '../../types';

const loginSchema = z.object({
  email: z.string().trim().min(1, 'Email is required').email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const redirectAfterLogin = (role: UserRole) => {
    const from = (location.state as { from?: { pathname: string } })?.from?.pathname;
    if (from) {
      navigate(from, { replace: true });
      return;
    }
    switch (role) {
      case 'ROLE_STUDENT':
        navigate('/student', { replace: true });
        break;
      case 'ROLE_FACULTY':
        navigate('/handler', { replace: true });
        break;
      case 'ROLE_HOD':
        navigate('/hod', { replace: true });
        break;
      case 'ROLE_ADMIN':
        navigate('/admin', { replace: true });
        break;
      default:
        navigate('/', { replace: true });
    }
  };

  const onSubmit = async (data: LoginFormData) => {
    setServerError(null);
    setSubmitting(true);
    try {
      const loggedUser = await login({
        email: data.email.trim(),
        password: data.password,
      });
      redirectAfterLogin(loggedUser.role);
    } catch (err: unknown) {
      const errorMsg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Failed to sign in. Please verify your email and password.';
      setServerError(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto my-8 p-6 sm:p-8 bg-white rounded-2xl border border-surface-200 shadow-card">
      <div className="text-center mb-6">
        <div className="w-12 h-12 mx-auto rounded-xl bg-gradient-to-tr from-brand-700 to-brand-500 flex items-center justify-center text-white mb-3 shadow-md shadow-brand-500/20">
          <ShieldAlert className="w-7 h-7" />
        </div>
        <h2 className="text-2xl font-extrabold text-surface-900">Sign in to CampusCare</h2>
        <p className="text-xs text-surface-500 mt-1">
          Enter your institutional credentials to access your dashboard
        </p>
      </div>

      {serverError && (
        <div className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start space-x-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{serverError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-surface-700 mb-1">Institutional Email</label>
          <input
            type="email"
            {...register('email')}
            placeholder="e.g. student.alice@campuscare.edu"
            autoComplete="email"
            className={`input-field ${errors.email ? 'border-rose-400 focus:ring-rose-200 focus:border-rose-500' : ''}`}
          />
          {errors.email && <p className="text-rose-500 text-[11px] mt-1">{errors.email.message}</p>}
        </div>

        <div>
          <label className="block text-xs font-semibold text-surface-700 mb-1">Password</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              {...register('password')}
              placeholder="••••••••"
              autoComplete="current-password"
              className={`input-field pr-10 ${errors.password ? 'border-rose-400 focus:ring-rose-200 focus:border-rose-500' : ''}`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              tabIndex={-1}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600 transition-colors"
              title={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.password && <p className="text-rose-500 text-[11px] mt-1">{errors.password.message}</p>}
        </div>

        <button type="submit" disabled={submitting} className="w-full btn-primary !py-2.5">
          {submitting ? (
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Signing In...</span>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <LogIn className="w-4 h-4" />
              <span>Sign In</span>
            </div>
          )}
        </button>
      </form>

      <div className="mt-6 pt-5 border-t border-surface-100 text-center text-xs text-surface-500">
        New student on CampusCare?{' '}
        <Link to="/register" className="text-brand-600 font-semibold hover:underline">
          Register Student Account
        </Link>
      </div>
    </div>
  );
};
