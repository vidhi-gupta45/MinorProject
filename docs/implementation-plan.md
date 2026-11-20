# CampusCare — Phase-Wise Implementation Plan & Progress Tracker

This document outlines the systematic, phase-by-phase implementation of CampusCare. Each phase must compile, run tests, and maintain a fully working application milestone before progressing.

---

## Progress Overview

| Phase | Description | Status |
|:---:|---|:---:|
| **Phase 0** | Repository Inspection, Architecture, Database & Workflow Planning | ✅ Completed |
| **Phase 1** | Project Scaffolding, Spring Boot + React + MySQL Setup, Flyway & OpenAPI | ✅ Completed |
| **Phase 2** | Authentication, Users, RBAC, Security & Seed Accounts | ✅ Completed |
| **Phase 3** | Issue Creation, Category Engine & Student Dashboard | ✅ Completed |
| **Phase 4** | Routing Engine, Assignment, Status Transitions & Handler Dashboard | ⏳ Next |
| **Phase 5** | In-App Notification Center & Async Notification Logs | ⬜ Pending |
| **Phase 6** | HOD Dashboard, Reassignment, Escalation & Analytics / CSV Export | ⬜ Pending |
| **Phase 7** | SLA Engine, Overdue Detection & Scheduled Escalations | ⬜ Pending |
| **Phase 8** | UI Polish, Component Aesthetics, Dark Mode & End-to-End Integration | ⬜ Pending |
| **Phase 9** | Comprehensive Testing (Unit, Integration, Security Scenarios) | ⬜ Pending |
| **Phase 10** | Production Deployment Prep, Docker & Final Documentation | ⬜ Pending |

---

## Detailed Phase Breakdown

### Phase 0: Repository Inspection & Planning (Completed)
- [x] Inspect workspace (empty directory detected).
- [x] Check environment tooling (Java 25 LTS, Maven 3.9, Node v23, npm 11, MySQL 9 running on port 3306).
- [x] Create project overview `README.md`.
- [x] Author `docs/architecture.md` (Modular monolith, layered design, security, storage abstraction).
- [x] Author `docs/database-design.md` (Relational schema, 11 entities, indexes, sequence generator).
- [x] Author `docs/role-permissions.md` (4 roles, endpoints, resource ownership, data privacy).
- [x] Author `docs/issue-workflow.md` (9 states, state machine, SLA calculation, idempotency).
- [x] Author `docs/implementation-plan.md`.

### Phase 1: Project Scaffolding & Database Foundation
- [ ] Initialize Spring Boot 3.3.x backend with Maven (`pom.xml`, Java 21/25).
- [ ] Configure `application.yml` and `application-dev.yml` with MySQL credentials, JPA, Flyway, and storage.
- [ ] Create initial Flyway migration `V1__init_schema.sql` based on `database-design.md`.
- [ ] Configure Springdoc OpenAPI / Swagger (`/swagger-ui.html`).
- [ ] Implement global exception handling (`GlobalExceptionHandler`) and standardized `ApiResponse<T>`.
- [ ] Implement HealthCheck endpoint (`/api/health`).
- [ ] Initialize React + TypeScript + Vite frontend with Tailwind CSS and Lucide React.
- [ ] Set up frontend API client with Axios interceptors and base routing layout.
- [ ] Verify both backend and frontend builds cleanly and database migrates.

### Phase 2: Authentication, Users, and Authorization
- [ ] Implement `Department` and `User` JPA entities and repositories.
- [ ] Implement `JwtTokenProvider`, `JwtAuthenticationFilter`, and `SecurityConfig`.
- [ ] Implement `AuthService` (Register, Login, Me, Change Password).
- [ ] Enforce `ROLE_STUDENT` on public registration.
- [ ] Create development seed runner (`DataSeeder`) with demo accounts for all 4 roles.
- [ ] Build React Auth pages: Login and Register with form validation (React Hook Form + Zod).
- [ ] Implement `AuthContext`, session restoration, and `ProtectedRoute` components.
- [ ] Verify login/logout and token handling.

### Phase 3: Issue Creation and Student Dashboard
- [ ] Implement `IssueCategory` and `Issue` entities and repositories.
- [ ] Implement atomic public issue ID generator (`CC-YYYY-XXXXX`).
- [ ] Implement `AttachmentService` (local disk storage abstraction with size/type validation).
- [ ] Implement Student Issue APIs: Submit Issue, List My Issues, Get Issue Detail.
- [ ] Build Student Dashboard screens:
  - Metric summary cards (Submitted, In-Progress, Resolved).
  - "Report an Issue" form with multi-image upload dropzone and live previews.
  - "My Issues" list with search, category/status filters, and pagination.
  - "Issue Details" view with timeline, attachments, and student-visible comments.

### Phase 4: Routing, Assignment & Status Workflow
- [ ] Implement `RoutingRule` entity, repository, and routing engine.
- [ ] Auto-route newly submitted issues to designated handlers or fallback to `UNASSIGNED`.
- [ ] Implement strict `IssueStateValidator` for state transitions.
- [ ] Implement Handler operations: Acknowledge, Start Work, Progress, Propose Resolution.
- [ ] Implement dual-visibility comments: Student-visible vs Internal Staff notes.
- [ ] Build Handler Dashboard screens:
  - Workload metrics and pending acknowledgments.
  - Assigned issues table with filters.
  - Handler issue detail view with status action buttons, resolution modal, and internal notes.
- [ ] Implement student resolution confirmation and reopening flow.

### Phase 5: Notifications System
- [ ] Implement `Notification` and `NotificationDeliveryLog` entities.
- [ ] Implement `NotificationService` for in-app alert persistence.
- [ ] Implement notification triggers across all lifecycle events (assigned, status change, comments).
- [ ] Implement Notification REST endpoints (list, unread count, mark read, mark all read).
- [ ] Configure optional async email notification channel with delivery logging.
- [ ] Build frontend notification popover bell and notification center page.

### Phase 6: HOD Dashboard & Administration
- [ ] Implement HOD query endpoints with department-level isolation.
- [ ] Implement manual assignment and reassignment APIs with audit history recording.
- [ ] Implement HOD routing rules management interface.
- [ ] Implement issue rejection with mandatory reason recording.
- [ ] Implement HOD Analytics API (metrics by category, status, priority, resolution times).
- [ ] Implement CSV report export endpoint (`/api/hod/reports/export`).
- [ ] Build HOD UI: Department overview, issue management, interactive Recharts graphs, and CSV download.
- [ ] Build Admin UI: User management, category management, SLA policy configuration.

### Phase 7: SLA, Escalation & Advanced Workflows
- [ ] Implement `SlaPolicy` entity and resolution deadline calculation.
- [ ] Implement Spring `@Scheduled` task for periodic SLA monitoring (every 15 min).
- [ ] Implement automated overdue tagging (`is_overdue = true`) and HOD escalation.
- [ ] Display SLA countdown timer and overdue warning badges on handler and HOD dashboards.
- [ ] Implement duplicate issue heuristic suggestions based on location and category.

### Phase 8: UI Polish & End-to-End Integration
- [ ] Audit all screens for responsive layout across desktop, tablet, and mobile.
- [ ] Enhance aesthetics: modern card glassmorphism, refined color scheme, micro-animations.
- [ ] Add confirmation modals for destructive or critical actions (reassign, reject, reopen).
- [ ] Verify empty states, loading skeletons, and toast alerts.

### Phase 9: Testing, Security Scenarios & Review
- [ ] Write JUnit 5 unit tests for state validator, routing engine, and SLA calculator.
- [ ] Write Spring Boot integration tests for security boundaries:
  - Student A trying to access Student B's issue (must be 403).
  - Student trying to register as HOD or Admin (blocked).
  - Unauthorized download of attachments.
  - Invalid state transition rejection (e.g. RESOLVED directly to IN_PROGRESS).
  - Optimistic locking conflict simulation.
- [ ] Run full backend test suite (`mvn test`) and frontend test/type checks (`tsc && npm run build`).

### Phase 10: Deployment & Verification
- [ ] Create Dockerfile for backend and frontend.
- [ ] Create `docker-compose.yml` for unified local containerized deployment.
- [ ] Document production setup, environment variables, and execution steps.
- [ ] Conduct end-to-end demonstration verification.
