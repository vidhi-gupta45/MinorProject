export type UserRole = 'ROLE_STUDENT' | 'ROLE_FACULTY' | 'ROLE_HOD' | 'ROLE_ADMIN';

export type IssueStatus =
  | 'SUBMITTED'
  | 'UNASSIGNED'
  | 'ASSIGNED'
  | 'ACKNOWLEDGED'
  | 'IN_PROGRESS'
  | 'RESOLVED'
  | 'CLOSED'
  | 'REOPENED'
  | 'REJECTED';

export type IssuePriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type CommentVisibility = 'STUDENT_VISIBLE' | 'INTERNAL_STAFF';

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors?: Array<{ field: string; message: string }>;
  errorCode?: string;
  timestamp: string;
}

export interface Department {
  id: number;
  name: string;
  departmentCode: string;
  active: boolean;
}

export interface User {
  id: number;
  fullName: string;
  email: string;
  role: UserRole;
  department?: Department;
  phoneNumber?: string;
  active: boolean;
}

export interface CategoryDto {
  id: number;
  code: string;
  name: string;
  description?: string;
  active: boolean;
}

export interface AttachmentResponse {
  id: number;
  originalFileName: string;
  contentType: string;
  fileSize: number;
  attachmentType: 'REPORT_ATTACHMENT' | 'RESOLUTION_EVIDENCE';
  downloadUrl: string;
  createdAt: string;
}

export interface CommentResponse {
  id: number;
  authorId: number;
  authorName: string;
  authorRole: string;
  body: string;
  visibility: CommentVisibility;
  createdAt: string;
}

export interface IssueHistoryResponse {
  id: number;
  actorName: string;
  actorRole: string;
  eventType: string;
  oldStatus?: string;
  newStatus?: string;
  comment?: string;
  createdAt: string;
}

export interface IssueSummaryResponse {
  id: number;
  publicIssueId: string;
  title: string;
  categoryName: string;
  categoryCode: string;
  status: IssueStatus;
  priority: IssuePriority;
  location: string;
  assignedHandlerName?: string;
  attachmentCount: number;
  commentCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface IssueDetailResponse {
  id: number;
  publicIssueId: string;
  title: string;
  description: string;
  category: CategoryDto;
  department: Department;
  reporter: User;
  assignedTo?: User;
  status: IssueStatus;
  priority: IssuePriority;
  location: string;
  responseDueAt?: string;
  resolutionDueAt?: string;
  acknowledgedAt?: string;
  resolvedAt?: string;
  closedAt?: string;
  resolutionNotes?: string;
  rejectionReason?: string;
  reopenCount: number;
  escalationLevel: number;
  isOverdue: boolean;
  attachments: AttachmentResponse[];
  comments: CommentResponse[];
  histories: IssueHistoryResponse[];
  createdAt: string;
  updatedAt: string;
}

export interface StudentDashboardSummary {
  totalSubmitted: number;
  inProgress: number;
  resolved: number;
  closed: number;
}

export interface HandlerDashboardSummary {
  assigned: number;
  acknowledged: number;
  inProgress: number;
  resolved: number;
  overdue: number;
}

export interface HodDashboardSummary {
  totalIssues: number;
  unassigned: number;
  inProgress: number;
  resolved: number;
  closed: number;
  overdue: number;
  activeHandlersCount: number;
}

export interface RoutingRuleDto {
  id: number;
  departmentId: number;
  departmentName: string;
  categoryId: number;
  categoryName: string;
  categoryCode: string;
  assigneeId: number;
  assigneeName: string;
  assigneeEmail: string;
  priorityCondition: string;
  active: boolean;
}

export interface AnalyticsSummaryDto {
  totalIssues: number;
  openIssues: number;
  inProgressIssues: number;
  resolvedIssues: number;
  closedIssues: number;
  overdueIssues: number;
  slaComplianceRate: number;
  averageResolutionHours: number;
  statusDistribution: Record<string, number>;
  categoryDistribution: Record<string, number>;
  priorityDistribution: Record<string, number>;
}

export interface NotificationItem {
  id: number;
  title: string;
  message: string;
  notificationType: string;
  issueId?: number;
  publicIssueId?: string;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
}

export interface HealthResponse {
  status: string;
  service: string;
  version: string;
  timestamp: string;
}

export interface AdminUserDto {
  id: number;
  email: string;
  fullName: string;
  role: UserRole;
  departmentId?: number;
  departmentName?: string;
  phoneNumber?: string;
  active: boolean;
  createdAt: string;
}

export interface CreateUserRequest {
  fullName: string;
  email: string;
  password: string;
  role: UserRole;
  departmentId?: number;
  phoneNumber?: string;
}

export interface UpdateUserRequest {
  fullName: string;
  role: UserRole;
  departmentId?: number;
  phoneNumber?: string;
  active?: boolean;
}

export interface CategoryAdminDto {
  id: number;
  code: string;
  name: string;
  description?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCategoryRequest {
  code: string;
  name: string;
  description?: string;
}

export interface UpdateCategoryRequest {
  name: string;
  description?: string;
  active?: boolean;
}

export interface SlaPolicyDto {
  id: number;
  categoryId: number;
  categoryName: string;
  categoryCode: string;
  priority: IssuePriority;
  responseTargetHours: number;
  resolutionTargetHours: number;
  active: boolean;
  updatedAt: string;
}

export interface UpdateSlaPolicyRequest {
  responseTargetHours: number;
  resolutionTargetHours: number;
  active?: boolean;
}

export interface AdminAuditLogDto {
  id: number;
  issueId: number;
  publicIssueId: string;
  issueTitle: string;
  actorId?: number;
  actorName: string;
  actorEmail: string;
  eventType: string;
  oldStatus?: string;
  newStatus?: string;
  previousAssigneeName?: string;
  newAssigneeName?: string;
  comment?: string;
  createdAt: string;
}

export interface AdminStatsDto {
  totalUsers: number;
  totalDepartments: number;
  totalCategories: number;
  totalIssues: number;
  activeHandlers: number;
  totalSlaPolicies: number;
  systemStatus: string;
}

