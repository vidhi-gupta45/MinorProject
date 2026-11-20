import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  MapPin,
  Clock,
  MessageSquare,
  Send,
  AlertCircle,
  CheckCircle,
  Image as ImageIcon,
  CheckCircle2,
  X,
  PlayCircle,
  Lock,
  Upload,
  Calendar,
} from 'lucide-react';
import {
  getHandlerIssueDetail,
  acknowledgeIssue,
  startWork,
  resolveIssue,
  addInternalNote,
} from '../../api/handler';
import { addStudentComment } from '../../api/issue';
import { getAttachmentUrl } from '../../api/client';
import type { IssueDetailResponse, IssueStatus, IssuePriority } from '../../types';

export const HandlerIssueDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [issue, setIssue] = useState<IssueDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Active tab for discussion: 'public' | 'internal'
  const [activeTab, setActiveTab] = useState<'public' | 'internal'>('public');

  // Comment input
  const [publicCommentText, setPublicCommentText] = useState('');
  const [submittingPublicComment, setSubmittingPublicComment] = useState(false);

  // Internal Note input
  const [internalNoteText, setInternalNoteText] = useState('');
  const [submittingInternalNote, setSubmittingInternalNote] = useState(false);

  // Resolution Modal
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [resolutionFiles, setResolutionFiles] = useState<File[]>([]);
  const [resolving, setResolving] = useState(false);
  const [resolveError, setResolveError] = useState<string | null>(null);

  // Action states
  const [actionLoading, setActionLoading] = useState(false);

  // Image Lightbox
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const fetchDetail = useCallback(() => {
    if (!id) return;
    setLoading(true);
    getHandlerIssueDetail(Number(id))
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

  const handleAcknowledge = async () => {
    if (!id) return;
    setActionLoading(true);
    setActionSuccess(null);
    try {
      const updated = await acknowledgeIssue(Number(id));
      setIssue(updated);
      setActionSuccess('Issue acknowledged successfully. Response SLA met!');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to acknowledge issue';
      setError(msg);
    } finally {
      setActionLoading(false);
    }
  };

  const handleStartWork = async () => {
    if (!id) return;
    setActionLoading(true);
    setActionSuccess(null);
    try {
      const updated = await startWork(Number(id));
      setIssue(updated);
      setActionSuccess('Work started. Status transitioned to IN_PROGRESS.');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to start work';
      setError(msg);
    } finally {
      setActionLoading(false);
    }
  };

  const handleResolveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !resolutionNotes.trim()) return;
    setResolving(true);
    setResolveError(null);
    try {
      const updated = await resolveIssue(Number(id), resolutionNotes.trim(), resolutionFiles);
      setIssue(updated);
      setShowResolveModal(false);
      setResolutionNotes('');
      setResolutionFiles([]);
      setActionSuccess('Issue marked as Resolved. Student notified for confirmation!');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to resolve issue';
      setResolveError(msg);
    } finally {
      setResolving(false);
    }
  };

  const handleAddPublicComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !publicCommentText.trim()) return;
    setSubmittingPublicComment(true);
    try {
      await addStudentComment(Number(id), publicCommentText.trim());
      setPublicCommentText('');
      fetchDetail();
    } catch (err) {
      console.error('Failed to add comment', err);
    } finally {
      setSubmittingPublicComment(false);
    }
  };

  const handleAddInternalNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !internalNoteText.trim()) return;
    setSubmittingInternalNote(true);
    try {
      await addInternalNote(Number(id), internalNoteText.trim());
      setInternalNoteText('');
      fetchDetail();
    } catch (err) {
      console.error('Failed to add internal note', err);
    } finally {
      setSubmittingInternalNote(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setResolutionFiles((prev) => [...prev, ...newFiles].slice(0, 3));
    }
  };

  const removeResolutionFile = (index: number) => {
    setResolutionFiles((prev) => prev.filter((_, i) => i !== index));
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
        return <span className="text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded">CRITICAL</span>;
      case 'HIGH':
        return <span className="text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">HIGH</span>;
      case 'MEDIUM':
        return <span className="text-xs font-semibold text-yellow-700 bg-yellow-50 border border-yellow-200 px-2 py-0.5 rounded">MEDIUM</span>;
      default:
        return <span className="text-xs text-surface-600 bg-surface-100 border border-surface-200 px-2 py-0.5 rounded">LOW</span>;
    }
  };

  if (loading) {
    return (
      <div className="card-premium p-12 text-center text-surface-400">
        <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs font-medium">Loading issue details...</p>
      </div>
    );
  }

  if (error || !issue) {
    return (
      <div className="card-premium p-8 text-center space-y-4">
        <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
        <div className="text-base font-bold text-surface-900">Unable to load issue</div>
        <p className="text-xs text-surface-500 max-w-md mx-auto">{error || 'Issue not found'}</p>
        <Link to="/handler/issues" className="btn-secondary !py-2 text-xs inline-flex items-center space-x-1.5">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Assigned Issues</span>
        </Link>
      </div>
    );
  }

  const publicComments = issue.comments.filter((c) => c.visibility === 'STUDENT_VISIBLE');
  const internalNotes = issue.comments.filter((c) => c.visibility === 'INTERNAL_STAFF');

  return (
    <div className="space-y-6">
      {/* Back button & Action Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link
          to="/handler/issues"
          className="inline-flex items-center space-x-1.5 text-xs font-medium text-surface-500 hover:text-surface-900 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Assigned Queue</span>
        </Link>

        {/* Dynamic Action Buttons */}
        <div className="flex items-center space-x-2">
          {issue.status === 'ASSIGNED' && (
            <button
              onClick={handleAcknowledge}
              disabled={actionLoading}
              className="btn-primary !py-2 text-xs flex items-center space-x-1.5 bg-purple-600 hover:bg-purple-700 text-white"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{actionLoading ? 'Acknowledging...' : 'Acknowledge Issue'}</span>
            </button>
          )}

          {(issue.status === 'ACKNOWLEDGED' || issue.status === 'REOPENED') && (
            <button
              onClick={handleStartWork}
              disabled={actionLoading}
              className="btn-primary !py-2 text-xs flex items-center space-x-1.5 bg-amber-600 hover:bg-amber-700 text-white"
            >
              <PlayCircle className="w-4 h-4" />
              <span>{actionLoading ? 'Starting Work...' : 'Start Work (In Progress)'}</span>
            </button>
          )}

          {issue.status === 'IN_PROGRESS' && (
            <button
              onClick={() => setShowResolveModal(true)}
              className="btn-primary !py-2 text-xs flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Propose Resolution</span>
            </button>
          )}
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

      {/* Main Issue Header Card */}
      <div className="card-premium p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-surface-100 pb-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2.5">
              <span className="font-mono text-sm font-extrabold text-surface-900 bg-surface-100 px-2.5 py-0.5 rounded border border-surface-200">
                {issue.publicIssueId}
              </span>
              {getStatusBadge(issue.status)}
              {getPriorityBadge(issue.priority)}
            </div>
            <h1 className="text-xl font-bold text-surface-900 mt-2">{issue.title}</h1>
          </div>

          <div className="text-right sm:self-start">
            <span className="text-[11px] text-surface-400">Created on</span>
            <div className="text-xs font-semibold text-surface-700">
              {new Date(issue.createdAt).toLocaleString()}
            </div>
          </div>
        </div>

        {/* SLA & Meta Highlights */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-2 bg-surface-50/70 p-3 rounded-xl border border-surface-200/60">
          <div>
            <span className="text-[10px] uppercase font-semibold text-surface-400">Category</span>
            <div className="text-xs font-bold text-surface-800">{issue.category.name}</div>
          </div>
          <div>
            <span className="text-[10px] uppercase font-semibold text-surface-400">Department</span>
            <div className="text-xs font-bold text-surface-800">{issue.department.name}</div>
          </div>
          <div>
            <span className="text-[10px] uppercase font-semibold text-surface-400">Reporter</span>
            <div className="text-xs font-bold text-surface-800">{issue.reporter.fullName}</div>
            <div className="text-[10px] text-surface-400 font-mono">{issue.reporter.email}</div>
          </div>
          <div>
            <span className="text-[10px] uppercase font-semibold text-surface-400">Location</span>
            <div className="text-xs font-bold text-surface-800 flex items-center space-x-1">
              <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
              <span>{issue.location}</span>
            </div>
          </div>
        </div>

        {/* SLA Due Warning if any */}
        {(issue.responseDueAt || issue.resolutionDueAt) && (
          <div className="flex flex-wrap gap-4 text-xs pt-1">
            {issue.responseDueAt && (
              <div className="flex items-center space-x-1.5 text-surface-500">
                <Clock className="w-3.5 h-3.5 text-purple-600" />
                <span>Response Due: {new Date(issue.responseDueAt).toLocaleString()}</span>
              </div>
            )}
            {issue.resolutionDueAt && (
              <div className="flex items-center space-x-1.5 text-surface-500">
                <Calendar className="w-3.5 h-3.5 text-amber-600" />
                <span>Resolution Due: {new Date(issue.resolutionDueAt).toLocaleString()}</span>
              </div>
            )}
            {issue.isOverdue && (
              <span className="badge bg-rose-50 text-rose-700 border border-rose-200 font-bold">
                SLA Breached
              </span>
            )}
          </div>
        )}

        {/* Description */}
        <div className="space-y-1 pt-2">
          <h3 className="text-xs font-bold uppercase text-surface-400">Description</h3>
          <p className="text-xs text-surface-800 leading-relaxed whitespace-pre-wrap">
            {issue.description}
          </p>
        </div>

        {/* Resolution Notes Banner if resolved */}
        {issue.resolutionNotes && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 space-y-1">
            <div className="text-xs font-bold flex items-center space-x-1.5">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span>Resolution Notes Submitted</span>
            </div>
            <p className="text-xs leading-relaxed">{issue.resolutionNotes}</p>
          </div>
        )}

        {/* Attachments Section */}
        {issue.attachments && issue.attachments.length > 0 && (
          <div className="pt-2">
            <h3 className="text-xs font-bold uppercase text-surface-400 mb-2 flex items-center space-x-1.5">
              <ImageIcon className="w-3.5 h-3.5 text-brand-600" />
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

      {/* Two Column Layout: Communications & Audit History */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Tabbed Discussion Panel */}
        <div className="lg:col-span-2 card-premium p-6 space-y-4">
          {/* Tab Navigation */}
          <div className="flex border-b border-surface-200">
            <button
              onClick={() => setActiveTab('public')}
              className={`pb-3 px-4 text-xs font-bold transition-colors relative flex items-center space-x-1.5 ${
                activeTab === 'public'
                  ? 'text-brand-600 border-b-2 border-brand-600'
                  : 'text-surface-500 hover:text-surface-900'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Student Discussion ({publicComments.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('internal')}
              className={`pb-3 px-4 text-xs font-bold transition-colors relative flex items-center space-x-1.5 ${
                activeTab === 'internal'
                  ? 'text-amber-700 border-b-2 border-amber-600'
                  : 'text-surface-500 hover:text-surface-900'
              }`}
            >
              <Lock className="w-3.5 h-3.5 text-amber-600" />
              <span>Internal Staff Notes ({internalNotes.length})</span>
              <span className="badge bg-amber-50 text-amber-800 border border-amber-200 text-[10px] ml-1">
                Staff Only
              </span>
            </button>
          </div>

          {/* Tab 1 Content: Public Discussion */}
          {activeTab === 'public' && (
            <div className="space-y-4">
              <p className="text-[11px] text-surface-400">
                Messages here are visible to the student who reported this issue and department coordinators.
              </p>

              {publicComments.length > 0 ? (
                <div className="space-y-3">
                  {publicComments.map((comment) => (
                    <div key={comment.id} className="p-3.5 rounded-xl bg-surface-50 border border-surface-200 space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center space-x-1.5">
                          <span className="font-bold text-surface-900">{comment.authorName}</span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-surface-200 text-surface-600 font-medium">
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
                <p className="text-xs text-surface-400 italic py-2">
                  No public messages yet. Use the form below to message the student.
                </p>
              )}

              <form onSubmit={handleAddPublicComment} className="pt-2 flex gap-2">
                <input
                  type="text"
                  value={publicCommentText}
                  onChange={(e) => setPublicCommentText(e.target.value)}
                  placeholder="Write a message or update for the student..."
                  className="input-field text-xs flex-1"
                />
                <button
                  type="submit"
                  disabled={submittingPublicComment || !publicCommentText.trim()}
                  className="btn-primary text-xs !px-4"
                >
                  <Send className="w-3.5 h-3.5 mr-1.5" />
                  <span>Send</span>
                </button>
              </form>
            </div>
          )}

          {/* Tab 2 Content: Internal Staff Notes */}
          {activeTab === 'internal' && (
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-amber-50/70 border border-amber-200 text-amber-900 text-[11px] flex items-center space-x-2">
                <Lock className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  <strong>Confidential:</strong> Internal notes are visible only to faculty handlers, HOD, and administrators. The student cannot see these notes.
                </span>
              </div>

              {internalNotes.length > 0 ? (
                <div className="space-y-3">
                  {internalNotes.map((note) => (
                    <div key={note.id} className="p-3.5 rounded-xl bg-amber-50/40 border border-amber-200 space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center space-x-1.5">
                          <span className="font-bold text-amber-950">{note.authorName}</span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 font-medium">
                            {note.authorRole.replace('ROLE_', '')}
                          </span>
                        </div>
                        <span className="text-[10px] text-amber-600">
                          {new Date(note.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                        </span>
                      </div>
                      <p className="text-xs text-amber-900 leading-relaxed font-sans">{note.body}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-surface-400 italic py-2">
                  No internal staff notes recorded yet.
                </p>
              )}

              <form onSubmit={handleAddInternalNote} className="pt-2 flex gap-2">
                <input
                  type="text"
                  value={internalNoteText}
                  onChange={(e) => setInternalNoteText(e.target.value)}
                  placeholder="Record an internal note (e.g., 'Vendor contacted for replacement parts')..."
                  className="input-field text-xs flex-1 border-amber-300 focus:border-amber-500"
                />
                <button
                  type="submit"
                  disabled={submittingInternalNote || !internalNoteText.trim()}
                  className="btn-primary text-xs !px-4 bg-amber-600 hover:bg-amber-700 text-white"
                >
                  <Lock className="w-3.5 h-3.5 mr-1.5" />
                  <span>Save Note</span>
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Right 1 Col: Audit History Timeline */}
        <div className="card-premium p-6 space-y-4">
          <div className="flex items-center space-x-2 border-b border-surface-100 pb-3">
            <Clock className="w-4 h-4 text-brand-600" />
            <h3 className="text-sm font-bold text-surface-900">Lifecycle Audit History</h3>
          </div>

          <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-surface-200">
            {issue.histories && issue.histories.length > 0 ? (
              issue.histories.map((hist) => (
                <div key={hist.id} className="relative space-y-1">
                  <div className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-brand-500 border-2 border-white shadow-sm" />
                  <div className="text-xs font-bold text-surface-900">{hist.eventType.replace(/_/g, ' ')}</div>
                  {hist.oldStatus && hist.newStatus && (
                    <div className="text-[11px] text-surface-500 font-mono">
                      {hist.oldStatus} &rarr; {hist.newStatus}
                    </div>
                  )}
                  {hist.comment && (
                    <div className="text-[11px] text-surface-600 bg-surface-50 p-2 rounded border border-surface-200">
                      {hist.comment}
                    </div>
                  )}
                  <div className="text-[10px] text-surface-400">
                    By {hist.actorName} ({hist.actorRole.replace('ROLE_', '')}) •{' '}
                    {new Date(hist.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-surface-400">No history events logged.</p>
            )}
          </div>
        </div>
      </div>

      {/* Propose Resolution Modal */}
      {showResolveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface-950/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-surface-200">
            <div className="flex items-center justify-between border-b border-surface-100 pb-3">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-bold text-surface-900">Propose Issue Resolution</h3>
              </div>
              <button
                onClick={() => setShowResolveModal(false)}
                className="text-surface-400 hover:text-surface-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-surface-500 leading-relaxed">
              Describe the remedial actions completed to resolve this issue. The student will be notified to review and verify the fix.
            </p>

            {resolveError && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                {resolveError}
              </div>
            )}

            <form onSubmit={handleResolveSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-surface-700">
                  Resolution Notes <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="Explain what steps were taken to fix the problem (e.g., 'Replaced broken switch and tested circuit breaker')..."
                  className="input-field text-xs w-full"
                />
              </div>

              {/* Photo Evidence Upload */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-surface-700 flex items-center justify-between">
                  <span>Remediation Evidence Photos (Optional, max 3)</span>
                  <span className="text-[10px] text-surface-400">JPEG, PNG, WebP up to 5MB</span>
                </label>

                <div className="flex items-center space-x-2">
                  <label className="btn-secondary !py-1.5 !px-3 text-xs cursor-pointer flex items-center space-x-1.5">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Evidence</span>
                    <input
                      type="file"
                      multiple
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleFileChange}
                      className="hidden"
                      disabled={resolutionFiles.length >= 3}
                    />
                  </label>
                  <span className="text-xs text-surface-400">
                    {resolutionFiles.length} / 3 selected
                  </span>
                </div>

                {resolutionFiles.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {resolutionFiles.map((file, idx) => (
                      <div
                        key={idx}
                        className="flex items-center space-x-1.5 bg-surface-100 border border-surface-200 rounded-lg px-2.5 py-1 text-xs text-surface-700"
                      >
                        <span className="truncate max-w-[150px]">{file.name}</span>
                        <button
                          type="button"
                          onClick={() => removeResolutionFile(idx)}
                          className="text-surface-400 hover:text-rose-600"
                        >
                          &times;
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-surface-100">
                <button
                  type="button"
                  onClick={() => setShowResolveModal(false)}
                  className="btn-secondary !py-2 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resolving || !resolutionNotes.trim()}
                  className="btn-primary !py-2 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <CheckCircle className="w-4 h-4 mr-1.5" />
                  <span>{resolving ? 'Submitting...' : 'Submit Resolution'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
