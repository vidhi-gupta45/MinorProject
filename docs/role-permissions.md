# CampusCare — Role-Based Access Control (RBAC) & Permissions Matrix

CampusCare enforces a dual-layered security architecture:
1. **Declarative Method-Level Security**: `@PreAuthorize("hasRole('ROLE_...')")` on REST controller endpoints.
2. **Domain Resource-Level Ownership Checks**: Evaluated in application services before reading or mutating entities.

---

## 1. System Roles

| Role Key | Name | Primary Responsibility |
|---|---|---|
| `ROLE_STUDENT` | Student | Primary issue reporter and verifier within their college department. |
| `ROLE_FACULTY` | Faculty / Issue Handler | Coordinator or staff member assigned to investigate, acknowledge, progress, and resolve issues. |
| `ROLE_HOD` | Head of Department | Department supervisor overseeing all issues, assignments, routing rules, and resolution SLA metrics. |
| `ROLE_ADMIN` | System Administrator | Platform administrator managing user accounts, departments, categories, SLA policies, and system audit logs. |

---

## 2. Comprehensive Permissions Matrix

| Feature / Action | STUDENT | FACULTY | HOD | ADMIN | Enforcement Mechanism |
|---|:---:|:---:|:---:|:---:|---|
| **Public Registration** | ✅ | ❌ | ❌ | ❌ | Registration endpoint forces `ROLE_STUDENT`. Privileged roles require Admin provisioning. |
| **View Profile & Change Password** | ✅ | ✅ | ✅ | ✅ | Authenticated user (`SecurityContext`). |
| **Submit New Issue** | ✅ | ❌ | ❌ | ❌ | `@PreAuthorize("hasRole('STUDENT')")` |
| **View My Reported Issues** | ✅ | ❌ | ❌ | ❌ | Filtered strictly by `reporter_id = currentUser.id`. |
| **View Assigned Issues** | ❌ | ✅ | ❌ | ❌ | Filtered strictly by `assigned_to = currentUser.id`. |
| **View All Departmental Issues** | ❌ | ❌ | ✅ | ❌ | Filtered by `department_id = currentUser.department.id`. |
| **View System-Wide Issues** | ❌ | ❌ | ❌ | ✅ | Platform-wide administrative audit. |
| **View Issue Details** | ✅ (Own) | ✅ (Assigned/Dept) | ✅ (Dept) | ✅ (All) | Service ownership verification. Unauthorized throws 403 Forbidden. |
| **Add Student-Visible Comment** | ✅ (Own) | ✅ (Assigned) | ✅ (Dept) | ❌ | Stored with `visibility = STUDENT_VISIBLE`. |
| **Add Internal Staff Note** | ❌ | ✅ (Assigned) | ✅ (Dept) | ❌ | Stored with `visibility = INTERNAL_STAFF`. Never returned to students. |
| **Acknowledge Issue** | ❌ | ✅ (Assigned) | ❌ | ❌ | Transitions `ASSIGNED -> ACKNOWLEDGED`. |
| **Mark In-Progress** | ❌ | ✅ (Assigned) | ❌ | ❌ | Transitions `ACKNOWLEDGED -> IN_PROGRESS`. |
| **Propose Resolution** | ❌ | ✅ (Assigned) | ❌ | ❌ | Requires resolution notes. Sets `RESOLVED`. |
| **Confirm Resolution & Close** | ✅ (Own) | ❌ | ❌ | ❌ | Transitions `RESOLVED -> CLOSED`. |
| **Request Reopening** | ✅ (Own) | ❌ | ❌ | ❌ | Transitions `RESOLVED -> REOPENED`. Increments reopen counter. |
| **Reject Issue** | ❌ | ❌ | ✅ (Dept) | ✅ | Allowed from initial states with mandatory reason. |
| **Manual Assign / Reassign** | ❌ | ❌ | ✅ (Dept) | ✅ | Records previous and new assignee in audit history. |
| **Escalate Issue** | ❌ | ❌ | ✅ (Dept) | ❌ | Sets escalation level and triggers alert notifications. |
| **Manage Routing Rules** | ❌ | ❌ | ✅ (Dept) | ✅ | Configure category to handler bindings. |
| **Manage Users & Roles** | ❌ | ❌ | ❌ | ✅ | Create, activate, deactivate user accounts. |
| **Manage Categories & SLA** | ❌ | ❌ | ❌ | ✅ | Global categories and SLA hour limits. |
| **View In-App Notifications** | ✅ | ✅ | ✅ | ✅ | Scoped strictly to `recipient_id = currentUser.id`. |
| **Export CSV Reports** | ❌ | ❌ | ✅ (Dept) | ✅ | Department-scoped report generation. |

---

## 3. Data Privacy & Resource Isolation Rules

### 3.1 Student Isolation
- A student cannot query or view another student's complaints.
- If Student A requests `/api/issues/105` which belongs to Student B, the service layer throws an `AccessDeniedException` (HTTP 403).
- Internal staff notes (`INTERNAL_STAFF`) are explicitly omitted from comment lists when the requesting user has `ROLE_STUDENT`.

### 3.2 Departmental Isolation for HODs
- An HOD is assigned to exactly one department (e.g. `CSE`).
- Queries executed by the HOD automatically inject `WHERE department_id = :hodDepartmentId`.
- An HOD cannot reassign issues belonging to another department.

### 3.3 Handler Boundaries
- A faculty member / handler only sees issues assigned to them, or category queues within their departmental scope.
- A handler cannot reassign an issue to arbitrary colleagues; they can submit a reassignment request or the HOD can reassign.

### 3.4 Public Registration Hardening
- Public registration accepts: `fullName`, `email`, `password`, `departmentId`.
- The `role` parameter is hardcoded to `ROLE_STUDENT` in the backend registration controller, ignoring any client-sent role flags.
- Admin, HOD, and Faculty accounts are created through the protected Admin Console or seed scripts.
