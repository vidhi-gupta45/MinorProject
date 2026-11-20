# CampusCare — Architecture & System Design

## 1. Architectural Philosophy: Modular Monolith

CampusCare is designed as a **Modular Monolith**. Rather than introducing premature microservices complexity (distributed transactions, service discovery, network latency, distributed logging), the backend encapsulates cohesive domain boundaries within a single deployable Spring Boot application.

Each domain module maintains strict internal encapsulation with clearly defined public service interfaces:

```
[ Frontend (React SPA) ]
           │
           │ HTTPS / REST (JSON) + JWT
           ▼
[ Spring Security Filter Chain & JWT Validation ]
           │
   ┌───────┴───────────────────────────────────────────┐
   │                                                   │
   ▼                                                   ▼
[ REST Controllers (Spring Web) ]          [ Global Exception Handler ]
   │                                                   ▲
   │ DTOs (Records)                                    │ Custom Exceptions
   ▼                                                   │
[ Application Services (Business Logic) ] ─────────────┘
   │
   ├─► User & Auth Module
   ├─► Issue Lifecycle & Validation Module
   ├─► Dynamic Category Routing Engine
   ├─► SLA Monitoring & Escalation Scheduler
   ├─► Multi-Visibility Comments & Notes
   ├─► Attachment Storage Abstraction (Local / S3)
   ├─► In-App & Async Email Notification Dispatcher
   └─► Analytics & CSV Export Service
   │
   ▼
[ Spring Data JPA Repositories & Optimistic Locking ]
   │
   ▼
[ MySQL 8+ Database (Managed via Flyway Migrations) ]
```

---

## 2. Backend Design Patterns & Standards

### 2.1 Layered Architecture
1. **Controllers (`com.campuscare.*.controller`)**:
   - Sole responsibility: Receive HTTP requests, validate input via Jakarta `@Valid`, delegate to domain services, and return standard `ApiResponse<T>` wrappers with appropriate HTTP status codes.
   - Zero business logic in controllers.
2. **Services (`com.campuscare.*.service`)**:
   - Enforce domain rules, transactional boundaries (`@Transactional`), and orchestrate multiple repositories.
   - Guard resource ownership and status transition rules.
3. **Repositories (`com.campuscare.*.repository`)**:
   - Spring Data JPA interfaces with type-safe query methods and optimized JPQL / native queries.
4. **Entities (`com.campuscare.*.entity`)**:
   - JPA entities with `@Table`, `@Column`, audit timestamps (`@CreatedDate`, `@LastModifiedDate`), and `@Version` for optimistic locking.
5. **DTOs (`com.campuscare.*.dto`)**:
   - Java 21 `record` types for request inputs and response projections to prevent direct exposure of persistent entities.
6. **Mappers (`com.campuscare.*.mapper`)**:
   - Explicit conversion between entities and immutable DTOs without leaky abstractions.

### 2.2 Security Architecture
- **Stateless Authentication**: Client sends Bearer JWT in the `Authorization` header.
- **Spring Security Filter Chain**: Intercepts requests, validates token signature and expiration, populates `SecurityContextHolder`.
- **Role & Resource-Level Authorization**:
  - Declarative authorization via `@PreAuthorize("hasRole('HOD') or ...")`.
  - Service-level checks verifying that a student can only access issues where `issue.reporter.id == currentUser.id`, and handlers can only access issues assigned to them or their department scope.
- **Password Security**: Passwords hashed using `BCryptPasswordEncoder` with strength 12.

### 2.3 Concurrency Control
- Issues use **Optimistic Locking** (`@Version private Long version;`).
- When concurrent updates occur (e.g. an HOD reassigns an issue while a handler updates progress), JPA throws an `OptimisticLockException`, which the global exception handler translates into an HTTP `409 Conflict` with a user-friendly message prompt to refresh the latest state.

### 2.4 Asynchronous Processing & Resiliency
- Notifications (especially optional email delivery via `JavaMailSender`) execute asynchronously via `@Async` and Spring events (`ApplicationEventPublisher`).
- **Resilience Guarantee**: If an external SMTP server fails or times out, the primary database transaction committing the issue creation or status update remains 100% successful. Failed emails are recorded in `notification_delivery_logs` for audit and retry.

### 2.5 File Storage Abstraction
- The `StorageService` interface exposes `storeFile(MultipartFile file, String subDirectory)` and `loadFileAsResource(String storageKey)`.
- Initial implementation: `LocalStorageService`, storing files outside the public web root (configured via `app.storage.upload-dir`).
- Designed for pluggable replacement by `S3StorageService` without modifying issue or attachment controllers.

---

## 3. Frontend Architecture

### 3.1 Technology Stack & Design System
- **React 18+ with TypeScript**: Strict typing throughout components, props, hooks, and API responses.
- **Tailwind CSS**: Premium design system featuring custom color tokens:
  - Primary: Deep indigo/blue (`#1e40af`, `#3b82f6`, `#6366f1`)
  - Neutral / Surfaces: Slate palette (`#0f172a`, `#1e293b`, `#f8fafc`)
  - Status Accents: Emerald (Resolved/Closed), Amber (In Progress), Rose (Critical/Rejected), Violet (Assigned)
- **Component Hierarchy**:
  - `Layout`: Shared sidebar, persistent header, breadcrumbs, notification badge popover, user avatar menu.
  - `ProtectedRoute`: Role-based route gatekeeper redirecting unauthorized users.
  - `UI Primitives`: Standardized Badges, Modals, Confirmation Dialogs, DataTables with pagination/sorting, File Dropzones.

### 3.2 State & API Layer
- **Axios Instance**: Configured with `baseURL: '/api'`, request interceptor attaching JWT token, response interceptor catching `401 Unauthorized` for automatic session expiration handling.
- **AuthContext**: Manages active user session, token in memory/storage, and provides `login()`, `logout()`, `hasRole()` utilities.
- **NotificationContext**: Polling provider (with configurable interval) maintaining live unread counter and badge sync.
- **React Hook Form + Zod**: Provides schema validation with instant inline feedback on client forms.

---

## 4. API Response Standardization

All REST endpoints adhere to a standardized envelope structure:

```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": { ... },
  "timestamp": "2026-10-14T14:30:00Z"
}
```

Error responses:
```json
{
  "success": false,
  "message": "Validation failed / Resource not found",
  "errors": [
    { "field": "category", "message": "Category is required" }
  ],
  "errorCode": "INVALID_STATE_TRANSITION",
  "timestamp": "2026-10-14T14:30:00Z"
}
```
