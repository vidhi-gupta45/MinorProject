import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { ShieldAlert, UserPlus, AlertCircle, Building2, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getDepartments } from '../../api/auth';
import type { Department } from '../../types';

const defaultFallbackDepartments: Department[] = [
  { id: 1, name: 'Computer Science & Engineering', departmentCode: 'CSE', active: true },
  { id: 2, name: 'Mechanical Engineering', departmentCode: 'MECH', active: true },
  { id: 3, name: 'Electrical Engineering', departmentCode: 'EE', active: true },
];

const registerSchema = z
  .object({
    fullName: z.string().trim().min(2, 'Full name must be at least 2 characters').max(120),
    email: z.string().trim().min(1, 'Email is required').email('Invalid institutional email address'),
    departmentId: z.coerce.number().min(1, 'Please select your department'),
    phoneNumber: z.string().optional(),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

export const RegisterPage: React.FC = () => {
  const { register: authRegister } = useAuth();
  const navigate = useNavigate();
  const [departments, setDepartments] = useState<Department[]>(defaultFallbackDepartments);
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: '',
      email: '',
      departmentId: 1,
      phoneNumber: '',
      password: '',
      confirmPassword: '',
    },
  });

  useEffect(() => {
    getDepartments()
      .then((data) => {
        if (data && data.length > 0) {
          setDepartments(data);
        }
      })
      .catch((err) => {
        console.warn('Using fallback departments list:', err);
      });
  }, []);

  const onSubmit = async (data: RegisterFormData) => {
    setServerError(null);
    setSubmitting(true);
    try {
      await authRegister({
        fullName: data.fullName.trim(),
        email: data.email.trim(),
        password: data.password,
        departmentId: Number(data.departmentId),
        phoneNumber: data.phoneNumber ? data.phoneNumber.trim() : undefined,
      });
      navigate('/student', { replace: true });
    } catch (err: unknown) {
      const errorMsg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (err as Error)?.message ||
        'Failed to register account. Please check your information.';
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
        <h2 className="text-2xl font-extrabold text-surface-900">Student Registration</h2>
        <p className="text-xs text-surface-500 mt-1">
          Create an institutional account to submit and track campus issues
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
          <label className="block text-xs font-semibold text-surface-700 mb-1">Full Name</label>
          <input
            type="text"
            {...register('fullName')}
            placeholder="e.g. Alice Smith"
            className={`input-field ${errors.fullName ? 'border-rose-400 focus:ring-rose-200 focus:border-rose-500' : ''}`}
          />
          {errors.fullName && <p className="text-rose-500 text-[11px] mt-1">{errors.fullName.message}</p>}
        </div>

        <div>
          <label className="block text-xs font-semibold text-surface-700 mb-1">Institutional Email</label>
          <input
            type="email"
            {...register('email')}
            placeholder="e.g. alice.smith@campuscare.edu"
            autoComplete="email"
            className={`input-field ${errors.email ? 'border-rose-400 focus:ring-rose-200 focus:border-rose-500' : ''}`}
          />
          {errors.email && <p className="text-rose-500 text-[11px] mt-1">{errors.email.message}</p>}
        </div>

        <div>
          <label className="block text-xs font-semibold text-surface-700 mb-1">Department</label>
          <div className="relative">
            <select
              {...register('departmentId')}
              className={`input-field appearance-none pr-8 ${errors.departmentId ? 'border-rose-400 focus:ring-rose-200 focus:border-rose-500' : ''}`}
              defaultValue="1"
            >
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.name} ({dept.departmentCode})
                </option>
              ))}
            </select>
            <Building2 className="w-4 h-4 text-surface-400 absolute right-3 top-3 pointer-events-none" />
          </div>
          {errors.departmentId && <p className="text-rose-500 text-[11px] mt-1">{errors.departmentId.message}</p>}
        </div>

        <div>
          <label className="block text-xs font-semibold text-surface-700 mb-1">Phone Number (Optional)</label>
          <input
            type="tel"
            {...register('phoneNumber')}
            placeholder="e.g. 9876543210"
            className="input-field"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-surface-700 mb-1">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                {...register('password')}
                placeholder="••••••••"
                autoComplete="new-password"
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

          <div>
            <label className="block text-xs font-semibold text-surface-700 mb-1">Confirm Password</label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                {...register('confirmPassword')}
                placeholder="••••••••"
                autoComplete="new-password"
                className={`input-field pr-10 ${errors.confirmPassword ? 'border-rose-400 focus:ring-rose-200 focus:border-rose-500' : ''}`}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                tabIndex={-1}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600 transition-colors"
                title={showConfirmPassword ? 'Hide password' : 'Show password'}
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-rose-500 text-[11px] mt-1">{errors.confirmPassword.message}</p>
            )}
          </div>
        </div>

        <button type="submit" disabled={submitting} className="w-full btn-primary !py-2.5 mt-2">
          {submitting ? (
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Creating Account...</span>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <UserPlus className="w-4 h-4" />
              <span>Register as Student</span>
            </div>
          )}
        </button>
      </form>

      <div className="mt-6 pt-5 border-t border-surface-100 text-center text-xs text-surface-500">
        Already registered?{' '}
        <Link to="/login" className="text-brand-600 font-semibold hover:underline">
          Sign In
        </Link>
      </div>
    </div>
  );
};
