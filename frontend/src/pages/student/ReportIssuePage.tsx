import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  FilePlus,
  UploadCloud,
  X,
  AlertCircle,
  CheckCircle2,
  Copy,
  Check,
  ArrowRight,
  MapPin,
  Tag,
  AlertTriangle,
} from 'lucide-react';
import { getCategories, createIssue } from '../../api/issue';
import type { CategoryDto } from '../../types';

const issueSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(200),
  description: z.string().min(15, 'Please provide a descriptive explanation (min 15 characters)'),
  categoryId: z.coerce.number().min(1, 'Please select a category'),
  location: z.string().min(3, 'Location is required (e.g. Lab 3, Block B)').max(200),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
});

type IssueFormData = z.infer<typeof issueSchema>;

export const ReportIssuePage: React.FC = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [filePreviews, setFilePreviews] = useState<string[]>([]);
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [createdIssueId, setCreatedIssueId] = useState<string | null>(null);
  const [createdIdNumber, setCreatedIdNumber] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<IssueFormData>({
    resolver: zodResolver(issueSchema),
    defaultValues: {
      priority: 'MEDIUM',
    },
  });

  const selectedCategoryId = watch('categoryId');
  const selectedPriority = watch('priority');

  useEffect(() => {
    getCategories()
      .then((data) => {
        setCategories(data);
        if (data.length > 0) {
          setValue('categoryId', data[0].id);
        }
      })
      .catch(() => setServerError('Failed to load issue categories. Please try again.'));
  }, [setValue]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const selectedFiles = Array.from(e.target.files);

    const validFiles: File[] = [];
    for (const f of selectedFiles) {
      if (f.size > 5 * 1024 * 1024) {
        alert(`File ${f.name} exceeds 5 MB limit.`);
        continue;
      }
      validFiles.push(f);
    }

    const updated = [...files, ...validFiles].slice(0, 5); // Max 5 attachments
    setFiles(updated);

    const previews = updated.map((f) => URL.createObjectURL(f));
    setFilePreviews(previews);
  };

  const removeFile = (index: number) => {
    const updated = files.filter((_, i) => i !== index);
    setFiles(updated);
    setFilePreviews(updated.map((f) => URL.createObjectURL(f)));
  };

  const onSubmit = async (data: IssueFormData) => {
    setServerError(null);
    setSubmitting(true);
    try {
      const formData = new FormData();
      const issueBlob = new Blob([JSON.stringify(data)], { type: 'application/json' });
      formData.append('issue', issueBlob);

      for (const file of files) {
        formData.append('files', file);
      }

      const response = await createIssue(formData);
      setCreatedIssueId(response.publicIssueId);
      setCreatedIdNumber(response.id);
    } catch (err: unknown) {
      const errorMsg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Failed to submit issue. Please check all required fields.';
      setServerError(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const copyIssueId = () => {
    if (createdIssueId) {
      navigator.clipboard.writeText(createdIssueId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const resetFormForNext = () => {
    setCreatedIssueId(null);
    setCreatedIdNumber(null);
    setFiles([]);
    setFilePreviews([]);
    reset();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center space-x-2 text-xs text-surface-500">
        <Link to="/student" className="hover:text-brand-600 transition-colors">
          Dashboard
        </Link>
        <span>/</span>
        <span className="text-surface-800 font-medium">Report an Issue</span>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 tracking-tight">Report a Campus Issue</h1>
          <p className="text-xs text-surface-500 mt-1">
            Submit a problem for departmental routing and resolution tracking
          </p>
        </div>
      </div>

      {serverError && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start space-x-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{serverError}</span>
        </div>
      )}

      {/* Success Celebration Modal */}
      {createdIssueId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface-950/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-surface-200 space-y-5">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-xl font-bold text-surface-900">Issue Submitted Successfully!</h3>
              <p className="text-xs text-surface-500">
                Your report has been recorded and will be assigned to the designated faculty coordinator.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-surface-50 border border-surface-200 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-semibold text-surface-400 uppercase tracking-wider">
                  Tracking Issue ID
                </span>
                <div className="text-lg font-extrabold text-brand-700 font-mono">{createdIssueId}</div>
              </div>
              <button
                type="button"
                onClick={copyIssueId}
                className="btn-secondary !p-2 text-xs"
                title="Copy Issue ID"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>

            <div className="flex space-x-3">
              <button
                type="button"
                onClick={resetFormForNext}
                className="btn-secondary flex-1 text-xs"
              >
                Submit Another
              </button>
              <button
                type="button"
                onClick={() => navigate(`/student/issues/${createdIdNumber}`)}
                className="btn-primary flex-1 text-xs"
              >
                <span>View Details</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Category Selection Card */}
        <div className="card-premium p-6 space-y-4">
          <div className="flex items-center space-x-2">
            <Tag className="w-4 h-4 text-brand-600" />
            <h3 className="text-sm font-bold text-surface-900">Select Issue Category</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {categories.map((cat) => {
              const isSelected = selectedCategoryId === cat.id;
              return (
                <button
                  type="button"
                  key={cat.id}
                  onClick={() => setValue('categoryId', cat.id, { shouldValidate: true })}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    isSelected
                      ? 'border-brand-500 bg-brand-50/50 ring-2 ring-brand-500/20'
                      : 'border-surface-200 bg-white hover:border-surface-300 hover:bg-surface-50/50'
                  }`}
                >
                  <div className="font-semibold text-xs text-surface-800">{cat.name}</div>
                  <div className="text-[11px] text-surface-400 mt-0.5 line-clamp-1">{cat.description}</div>
                </button>
              );
            })}
          </div>
          {errors.categoryId && <p className="text-rose-500 text-[11px]">{errors.categoryId.message}</p>}
        </div>

        {/* Issue Details Card */}
        <div className="card-premium p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-surface-700 mb-1">Issue Title</label>
            <input
              type="text"
              {...register('title')}
              placeholder="e.g. Broken projector in Room 302"
              className={`input-field ${errors.title ? 'border-rose-400 focus:ring-rose-200' : ''}`}
            />
            {errors.title && <p className="text-rose-500 text-[11px] mt-1">{errors.title.message}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-surface-700 mb-1">
                <span className="flex items-center space-x-1">
                  <MapPin className="w-3.5 h-3.5 text-surface-400" />
                  <span>Physical Campus Location</span>
                </span>
              </label>
              <input
                type="text"
                {...register('location')}
                placeholder="e.g. Block B, 2nd Floor, Lab 4"
                className={`input-field ${errors.location ? 'border-rose-400 focus:ring-rose-200' : ''}`}
              />
              {errors.location && <p className="text-rose-500 text-[11px] mt-1">{errors.location.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-surface-700 mb-1">
                <span className="flex items-center space-x-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-surface-400" />
                  <span>Suggested Priority</span>
                </span>
              </label>
              <select
                {...register('priority')}
                className="input-field"
                value={selectedPriority}
              >
                <option value="LOW">Low (Minor inconvenience)</option>
                <option value="MEDIUM">Medium (Normal priority)</option>
                <option value="HIGH">High (Disrupts classes / labs)</option>
                <option value="CRITICAL">Critical (Immediate safety hazard)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-surface-700 mb-1">Detailed Description</label>
            <textarea
              rows={4}
              {...register('description')}
              placeholder="Describe the problem, when it occurred, and any impact..."
              className={`input-field resize-none ${errors.description ? 'border-rose-400 focus:ring-rose-200' : ''}`}
            />
            {errors.description && <p className="text-rose-500 text-[11px] mt-1">{errors.description.message}</p>}
          </div>
        </div>

        {/* Attachments Dropzone Card */}
        <div className="card-premium p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-surface-900">Photo Attachments (Optional)</h3>
            <span className="text-[11px] text-surface-400">Max 5 images (JPEG, PNG, WebP ≤ 5 MB)</span>
          </div>

          <label className="border-2 border-dashed border-surface-200 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer hover:border-brand-400 hover:bg-brand-50/20 transition-all">
            <UploadCloud className="w-8 h-8 text-surface-400 mb-2" />
            <span className="text-xs font-semibold text-surface-700">Click to upload or drag images here</span>
            <span className="text-[10px] text-surface-400 mt-1">Photos help handlers diagnose issues faster</span>
            <input
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>

          {filePreviews.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
              {filePreviews.map((url, idx) => (
                <div key={idx} className="relative group rounded-lg overflow-hidden border border-surface-200 bg-surface-100 aspect-square">
                  <img src={url} alt={`Preview ${idx}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeFile(idx)}
                    className="absolute top-1 right-1 p-1 rounded-full bg-surface-900/70 text-white hover:bg-rose-600 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                  <div className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-surface-900/60 text-white text-[9px] font-mono">
                    {(files[idx].size / (1024 * 1024)).toFixed(1)} MB
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Submit Actions */}
        <div className="flex justify-end space-x-3">
          <Link to="/student" className="btn-secondary text-xs">
            Cancel
          </Link>
          <button type="submit" disabled={submitting} className="btn-primary !px-6 text-xs">
            {submitting ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Submitting Report...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <FilePlus className="w-4 h-4" />
                <span>Submit Issue</span>
              </div>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
