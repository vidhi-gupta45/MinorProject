import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  MapPin,
  Clock,
  User,
  MessageSquare,
  Send,
  AlertCircle,
  CheckCircle,
  FileText,
  Image as ImageIcon,
  CheckCircle2,
  X,
  RotateCcw,
} from 'lucide-react';
import { getStudentIssueDetail, addStudentComment } from '../../api/issue';
import { confirmResolution, reopenIssue } from '../../api/handler';
import { getAttachmentUrl } from '../../api/client';
import type { IssueDetailResponse, IssueStatus, IssuePriority } from '../../types';

export const IssueDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [issue, setIssue] = useState<IssueDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [commentError, setCommentError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [showReopenModal, setShowReopenModal] = useState(false);
  const [reopenReason, setReopenReason] = useState('');
  const [reopening, setReopening] = useState(false);
  const [reopenError, setReopenError] = useState<string | null>(null);

  const handleConfirmResolution = async () => {
    if (!id) return;
    setActionLoading(true);
    setActionSuccess(null);
    setActionError(null);
    try {
      const updated = await confirmResolution(Number(id));
      setIssue(updated);
      setActionSuccess('Resolution confirmed. Thank you! This issue is now closed.');
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Failed to confirm resolution.';
      setActionError(msg);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReopenSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !reopenReason.trim()) return;
    setReopening(true);
    setReopenError(null);
    try {
      const updated = await reopenIssue(Number(id), reopenReason.trim());
      setIssue(updated);
      setShowReopenModal(false);
      setReopenReason('');
      setActionSuccess('Issue reopened. The handler has been notified that the issue persists.');
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Failed to reopen issue.';
      setReopenError(msg);
    } finally {
      setReopening(false);
    }
  };

  const fetchDetail = useCallback(() => {
    if (!id) return;
    setLoading(true);
    getStudentIssueDetail(Number(id))
      .then((data) => {
        setIssue(data);
        setLoading(false);
      })
      .catch((err) => {
        const msg =
          err?.response?.data?.message ||
          'Failed to load issue details. You might not have permission to view this issue.';
        setError(msg);
        setLoading(false);
      });
  }, [id]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !id) return;
    setSubmittingComment(true);
    setCommentError(null);
    try {
      await addStudentComment(Number(id), commentText.trim());
      setCommentText('');
      fetchDetail(); // Refresh issue details to show new comment and history
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Failed to add comment.';
      setCommentError(msg);
    } finally {
      setSubmittingComment(false);
    }
  };

  const getStatusBadge = (status: IssueStatus) => {
    switch (status) {
      case 'SUBMITTED':
        return <span className="badge bg-blue-50 text-blue-700 border border-blue-200">Submitted</span>;
      case 'ASSIGNED':
        return <span className="badge bg-purple-50 text-purple-700 border border-purple-200">Assigned</span>;
      case 'ACKNOWLEDGED':
        return <span className="badge bg-indigo-50 text-indigo-700 border border-indigo-200">Acknowledged</span>;
      case 'IN_PROGRESS':
        return <span className="badge bg-amber-50 text-amber-700 border border-amber-200">In Progress</span>;
      case 'RESOLVED':
        return <span className="badge bg-emerald-50 text-emerald-700 border border-emerald-200">Resolved</span>;
      case 'CLOSED':
        return <span className="badge bg-slate-100 text-slate-700 border border-slate-300">Closed</span>;
      case 'REOPENED':
        return <span className="badge bg-orange-50 text-orange-700 border border-orange-200">Reopened</span>;
      case 'REJECTED':
        return <span className="badge bg-rose-50 text-rose-700 border border-rose-200">Rejected</span>;
      default:
        return <span className="badge bg-surface-100 text-surface-700">{status}</span>;
    }
  };

  const getPriorityBadge = (priority: IssuePriority) => {
    switch (priority) {
      case 'CRITICAL':
        return <span className="text-xs font-bold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded">CRITICAL</span>;
      case 'HIGH':
        return <span className="text-xs font-bold text-orange-600 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded">HIGH</span>;
      case 'MEDIUM':
        return <span className="text-xs font-semibold text-yellow-700 bg-yellow-50 border border-yellow-200 px-2 py-0.5 rounded">MEDIUM</span>;
      case 'LOW':
        return <span className="text-xs font-semibold text-blue-600 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">LOW</span>;
      default:
        return null;
    }
  };

  const getStepProgressIndex = (status: IssueStatus) => {
    switch (status) {
      case 'SUBMITTED':
      case 'UNASSIGNED':
        return 0;
      case 'ASSIGNED':
      case 'ACKNOWLEDGED':
        return 1;
      case 'IN_PROGRESS':
      case 'REOPENED':
        return 2;
      case 'RESOLVED':
        return 3;
      case 'CLOSED':
        return 4;
      default:
        return 0;
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center">
        <div className="w-8 h-8 border-3 border-brand-200 border-t-brand-600 rounded-full animate-spin mx-auto mb-2" />
        <p className="text-xs text-surface-500">Loading issue details...</p>
      </div>
    );
  }

  if (error || !issue) {
    return (
      <div className="max-w-md mx-auto my-12 p-8 bg-white rounded-2xl border border-surface-200 shadow-card text-center">
        <div className="w-12 h-12 mx-auto rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mb-3">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-surface-900">Unable to View Issue</h3>
        <p className="text-xs text-surface-500 mt-2">{error || 'Issue not found'}</p>
        <div className="mt-6">
          <Link to="/student/issues" className="btn-secondary text-xs">
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            <span>Back to My Issues</span>
          </Link>
        </div>
      </div>
    );
  }

  const currentStep = getStepProgressIndex(issue.status);
  const steps = ['Submitted', 'Assigned', 'In Progress', 'Resolved', 'Closed'];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Breadcrumb & Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 text-xs text-surface-500">
          <Link to="/student/issues" className="hover:text-brand-600 flex items-center space-x-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>My Issues</span>
          </Link>
          <span>/</span>
          <span className="font-mono font-bold text-surface-800">{issue.publicIssueId}</span>
        </div>
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

      {actionError && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between animate-fadeIn">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span className="font-medium">{actionError}</span>
          </div>
          <button
            onClick={() => setActionError(null)}
            className="text-rose-700 hover:text-rose-900 font-bold ml-2"
          >
            &times;
          </button>
        </div>
      )}

      {/* Resolution Verification Banner if issue is in RESOLVED status */}
      {issue.status === 'RESOLVED' && (
        <div className="card-premium p-5 bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border-2 border-emerald-300 shadow-md space-y-3">
          <div className="flex items-start space-x-3 text-emerald-900">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-bold">Action Needed: Verify Resolution</h3>
              <p className="text-xs text-emerald-800 mt-0.5">
                The assigned handler has addressed this issue and proposed a resolution. Please confirm that the problem is resolved to close this ticket, or reopen it if the problem persists.
              </p>
            </div>
          </div>

          {issue.resolutionNotes && (
            <div className="text-xs bg-white/90 p-3 rounded-lg border border-emerald-200 text-emerald-950">
              <strong className="text-emerald-800">Handler's Resolution Notes:</strong>
              <p className="mt-1 leading-relaxed">{issue.resolutionNotes}</p>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <button
              onClick={handleConfirmResolution}
              disabled={actionLoading}
              className="btn-primary !py-2 text-xs bg-emerald-600 hover:bg-emerald-700 text-white flex items-center space-x-1.5 shadow-sm"
            >
              <CheckCircle className="w-4 h-4" />
              <span>{actionLoading ? 'Closing Issue...' : 'Confirm Resolution & Close Issue'}</span>
            </button>
            <button
              onClick={() => setShowReopenModal(true)}
              disabled={actionLoading}
              className="btn-secondary !py-2 text-xs border-orange-300 text-orange-700 hover:bg-orange-50 flex items-center space-x-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5 text-orange-600" />
              <span>Problem Persists (Reopen)</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Header Card */}
      <div className="card-premium p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-surface-100 pb-4">
          <div className="flex items-center space-x-3">
            <span className="text-sm font-extrabold font-mono text-brand-700 bg-brand-50 px-2.5 py-1 rounded-lg border border-brand-200">
              {issue.publicIssueId}
            </span>
            <span className="text-xs font-semibold text-surface-600 bg-surface-100 px-2.5 py-1 rounded-lg">
              {issue.category.name}
            </span>
            {getPriorityBadge(issue.priority)}
          </div>
          <div>{getStatusBadge(issue.status)}</div>
        </div>

        <div>
          <h1 className="text-2xl font-extrabold text-surface-900">{issue.title}</h1>
          <div className="flex flex-wrap items-center gap-4 text-xs text-surface-500 mt-2">
            <div className="flex items-center space-x-1">
              <MapPin className="w-4 h-4 text-surface-400" />
              <span>{issue.location}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Clock className="w-4 h-4 text-surface-400" />
              <span>Reported on {new Date(issue.createdAt).toLocaleString()}</span>
            </div>
            <div className="flex items-center space-x-1">
              <User className="w-4 h-4 text-surface-400" />
              <span>Handler: {issue.assignedTo ? issue.assignedTo.fullName : 'Pending Assignment'}</span>
            </div>
          </div>
        </div>

        {/* Visual Lifecycle Progress Bar */}
        <div className="pt-4 border-t border-surface-100">
          <div className="text-xs font-semibold text-surface-700 mb-3">Lifecycle Progress</div>
          <div className="grid grid-cols-5 gap-2 text-center text-xs">
            {steps.map((step, idx) => {
              const isPast = idx < currentStep;
              const isCurrent = idx === currentStep;
              return (
                <div key={step} className="flex flex-col items-center">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs mb-1.5 transition-colors ${
                      isPast
                        ? 'bg-emerald-600 text-white'
                        : isCurrent
                        ? 'bg-brand-600 text-white ring-4 ring-brand-100'
                        : 'bg-surface-100 text-surface-400'
                    }`}
                  >
                    {isPast ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                  </div>
                  <span
                    className={`text-[11px] font-medium ${
                      isCurrent ? 'text-brand-700 font-bold' : isPast ? 'text-surface-700' : 'text-surface-400'
                    }`}
                  >
                    {step}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Description & Attachments Card */}
      <div className="card-premium p-6 space-y-5">
        <div>
          <h3 className="text-sm font-bold text-surface-900 mb-2 flex items-center space-x-1.5">
            <FileText className="w-4 h-4 text-brand-600" />
            <span>Problem Description</span>
          </h3>
          <p className="text-xs sm:text-sm text-surface-700 whitespace-pre-wrap leading-relaxed bg-surface-50 p-4 rounded-xl border border-surface-200">
            {issue.description}
          </p>
        </div>

        {/* Resolution Notes if available */}
        {issue.resolutionNotes && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 space-y-1">
            <div className="text-xs font-bold flex items-center space-x-1.5">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span>Handler Resolution Notes</span>
            </div>
            <p className="text-xs leading-relaxed">{issue.resolutionNotes}</p>
          </div>
        )}

        {/* Attachments Section */}
        {issue.attachments && issue.attachments.length > 0 && (
          <div>
            <h3 className="text-sm font-bold text-surface-900 mb-2 flex items-center space-x-1.5">
              <ImageIcon className="w-4 h-4 text-brand-600" />
              <span>Attached Images ({issue.attachments.length})</span>
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {issue.attachments.map((att) => (
                <button
                  type="button"
                  key={att.id}
                  onClick={() => setSelectedImage(getAttachmentUrl(att.downloadUrl))}
                  className="rounded-xl overflow-hidden border border-surface-200 bg-surface-100 aspect-video relative group hover:border-brand-400 transition-colors"
                >
                  <img
                    src={getAttachmentUrl(att.downloadUrl)}
                    alt={att.originalFileName}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                  <div className="absolute inset-0 bg-surface-900/0 group-hover:bg-surface-900/30 transition-colors flex items-center justify-center">
                    <span className="opacity-0 group-hover:opacity-100 text-[10px] text-white font-medium bg-surface-900/70 px-2 py-0.5 rounded">
                      Click to expand
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Image Modal Lightbox */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface-950/80 backdrop-blur-sm"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-3xl max-h-[90vh] bg-surface-900 rounded-2xl overflow-hidden">
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-3 right-3 p-2 rounded-full bg-surface-800/80 text-white hover:bg-rose-600 transition-colors z-10"
            >
              <X className="w-5 h-5" />
            </button>
            <img src={selectedImage} alt="Attachment Full Size" className="max-w-full max-h-[85vh] object-contain" />
          </div>
        </div>
      )}

      {/* Discussion & Public Comments */}
      <div className="card-premium p-6 space-y-5">
        <div className="flex items-center space-x-2 border-b border-surface-100 pb-3">
          <MessageSquare className="w-4 h-4 text-brand-600" />
          <h3 className="text-sm font-bold text-surface-900">Discussion & Clarifications</h3>
          <span className="text-xs text-surface-400">({issue.comments?.length || 0})</span>
        </div>

        {issue.comments && issue.comments.length > 0 ? (
          <div className="space-y-3">
            {issue.comments.map((comment) => (
              <div key={comment.id} className="p-3.5 rounded-xl bg-surface-50 border border-surface-200 space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-1.5">
                    <span className="font-bold text-surface-900">{comment.authorName}</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-surface-200 text-surface-600">
                      {comment.authorRole.replace('ROLE_', '')}
                    </span>
                  </div>
                  <span className="text-[10px] text-surface-400">
                    {new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-xs text-surface-700 leading-relaxed">{comment.body}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-surface-400 italic">No comments yet. Have a question or update? Post below.</p>
        )}

        {commentError && (
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
            {commentError}
          </div>
        )}

        <form onSubmit={handleAddComment} className="pt-2 flex gap-2">
          <input
            type="text"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Write a message or additional details for the handler..."
            className="input-field text-xs flex-1"
          />
          <button type="submit" disabled={submittingComment || !commentText.trim()} className="btn-primary text-xs !px-4">
            <Send className="w-3.5 h-3.5 mr-1.5" />
            <span>Send</span>
          </button>
        </form>
      </div>

      {/* Reopen Issue Modal */}
      {showReopenModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface-950/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-surface-200">
            <div className="flex items-center justify-between border-b border-surface-100 pb-3">
              <div className="flex items-center space-x-2">
                <RotateCcw className="w-5 h-5 text-orange-600" />
                <h3 className="text-base font-bold text-surface-900">Reopen Issue</h3>
              </div>
              <button
                onClick={() => setShowReopenModal(false)}
                className="text-surface-400 hover:text-surface-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-surface-600 leading-relaxed">
              Please explain why the issue is not fixed or what problem persists so the handler can take appropriate remedial action.
            </p>

            {reopenError && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                {reopenError}
              </div>
            )}

            <form onSubmit={handleReopenSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-surface-700">
                  Reason for Reopening <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  value={reopenReason}
                  onChange={(e) => setReopenReason(e.target.value)}
                  placeholder="e.g., 'The projector still turns off intermittently after 5 minutes of use'..."
                  className="input-field text-xs w-full"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-surface-100">
                <button
                  type="button"
                  onClick={() => setShowReopenModal(false)}
                  className="btn-secondary !py-2 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={reopening || !reopenReason.trim()}
                  className="btn-primary !py-2 text-xs bg-orange-600 hover:bg-orange-700 text-white"
                >
                  <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                  <span>{reopening ? 'Reopening...' : 'Reopen Issue'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
