# CampusCare — Smart Campus Issue Reporting and Resolution Platform

CampusCare is a full-stack, enterprise-grade web application built to streamline, track, and resolve academic, infrastructure, maintenance, IT, cleanliness, and laboratory issues across college departments.

---

## 1. System Overview

CampusCare replaces disorganized reporting channels (WhatsApp, direct emails, paper slips, verbal complaints) with an end-to-end digital lifecycle:
**Report → Categorize → Route & Assign → Notify → Acknowledge → Progress → Resolve → Verify → Close / Reopen**

### Key Features
- **Role-Based Access Control**: Tailored dashboards for **STUDENT**, **FACULTY / HANDLER**, **HOD**, and **ADMIN**.
- **Automated Category-Based Routing**: Configurable departmental routing engine assigning issues directly to specialized coordinators.
- **Robust SLA & Escalation Engine**: Automated monitoring for acknowledgment and resolution deadlines with HOD escalation triggers.
- **Audit History & Timeline**: Full traceability of all status transitions, reassignments, notes, and escalations.
- **Attachment Management**: Secure multi-file upload abstraction (images/evidence) stored outside the web root with access checks.
- **Dual Visibility Communication**: Distinguishes student-visible comments from internal staff notes.
- **In-App Notification Center & Optional Email**: Reliable notification persistence unaffected by external SMTP failures.
- **Analytics & Export**: Departmental KPI cards, resolution time trends, category breakdown, handler workloads, and CSV export.

---

## 2. Technology Stack

### Backend
- **Language / Runtime**: Java 21 / 25 LTS
- **Framework**: Spring Boot 3.3.x (Spring Web, Spring Data JPA, Spring Security)
- **Database**: MySQL 8.x / 9.x with Flyway database migrations
- **Authentication**: JWT (JSON Web Tokens) with Spring Security filter chain and BCrypt hashing
- **Validation**: Jakarta Bean Validation (`hibernate-validator`)
- **Documentation**: Springdoc OpenAPI / Swagger UI
- **Build Tool**: Apache Maven

### Frontend
- **Framework**: React 18+ with TypeScript
- **Bundler & Tooling**: Vite
- **Styling**: Tailwind CSS with custom aesthetic tokens, dark accents, and responsive UI components
- **Routing**: React Router v6 with authenticated and role-guarded route trees
- **Forms & Validation**: React Hook Form with Zod schemas
- **Visualizations**: Recharts for departmental analytics
- **Icons**: Lucide React

---

## 3. Project Structure

```text
MinorProject/
├── backend/                       # Spring Boot 3 Java application
│   ├── pom.xml
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/campuscare/
│   │   │   │   ├── CampusCareApplication.java
│   │   │   │   ├── config/        # Security, CORS, OpenAPI, Storage, Async configs
│   │   │   │   ├── security/      # JWT provider, filter, UserDetails, AuthEntryPoint
│   │   │   │   ├── common/        # Base entities, API response wrappers, exception handling
│   │   │   │   ├── user/          # User & Department entities, DTOs, controllers, services
│   │   │   │   ├── issue/         # Issue entity, lifecycle state machine, DTOs, controllers
│   │   │   │   ├── routing/       # Category routing engine & rules management
│   │   │   │   ├── comment/       # Student comments & internal notes
│   │   │   │   ├── attachment/    # File storage abstraction & secure media endpoints
│   │   │   │   ├── notification/  # In-app notification center & email dispatching
│   │   │   │   ├── sla/           # SLA targets, overdue checker, scheduling & escalations
│   │   │   │   └── analytics/     # HOD KPIs, charts aggregation, CSV report exports
│   │   │   └── resources/
│   │   │       ├── application.yml
│   │   │       ├── application-dev.yml
│   │   │       └── db/migration/  # Flyway SQL migration scripts (V1, V2, etc.)
│   │   └── test/                  # JUnit 5 & Mockito integration and unit tests
├── frontend/                      # React + TypeScript + Vite web application
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── src/
│   │   ├── api/                   # Axios client, interceptors, typed API endpoints
│   │   ├── context/               # AuthContext, NotificationContext
│   │   ├── components/            # Reusable UI elements (Navbar, Sidebar, Badges, Modals)
│   │   ├── layouts/               # Dashboard layout with role navigation
│   │   ├── pages/
│   │   │   ├── auth/              # Login, Register
│   │   │   ├── student/           # Student Home, Report Issue, My Issues, Issue Detail
│   │   │   ├── handler/           # Handler Overview, Assigned Issues, Workload
│   │   │   ├── hod/               # HOD Overview, Dept Issues, Routing Rules, Analytics
│   │   │   ├── admin/             # User Management, Categories, SLA Policies, Audit
│   │   │   └── common/            # Profile, Notifications Center, 404
│   │   └── types/                 # Shared TypeScript models and enum contracts
└── docs/                          # Comprehensive technical design documentation
    ├── architecture.md            # Modular monolith architecture & design patterns
    ├── database-design.md         # Relational schema, ER model, indexes & constraints
    ├── role-permissions.md        # Authorization matrix and resource ownership checks
    ├── issue-workflow.md          # State transition validator, lifecycle & SLA rules
    └── implementation-plan.md     # Phase-wise deliverables & progress tracker
```

---

## 4. Getting Started

### Prerequisites
1. **Java Development Kit (JDK 21 or higher)**: Verify with `java -version`
2. **Apache Maven (3.9+)**: Verify with `mvn -version`
3. **Node.js (v18+) & npm (v9+)**: Verify with `node -v && npm -v`
4. **MySQL (v8.0+ or v9.0+)**: Running locally on port 3306

### Quick Setup

#### 1. Database Setup
Create the MySQL database (default credentials can be customized in `application.yml` or environment variables):
```sql
CREATE DATABASE campuscare CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

#### 2. Backend Setup
```bash
cd backend
mvn clean install
mvn spring-boot:run
```
Backend will start on `http://localhost:8080`.
- Swagger UI Documentation: `http://localhost:8080/swagger-ui.html`
- Health check: `http://localhost:8080/api/health`

#### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Frontend will start on `http://localhost:5173`.

---

## 5. Seed Demo Accounts

When running in development profile (`dev`), the system can seed initial roles and sample data:
- **System Administrator**: `admin@campuscare.edu` / `Admin@123`
- **Head of Department (HOD)**: `hod.cs@campuscare.edu` / `Hod@123`
- **IT Coordinator**: `faculty.it@campuscare.edu` / `Faculty@123`
- **Maintenance In-Charge**: `faculty.maint@campuscare.edu` / `Faculty@123`
- **Student**: `student.alice@campuscare.edu` / `Student@123`

---

## 6. Documentation Index
- [Architecture & Design Details](docs/architecture.md)
- [Database Schema & ER Design](docs/database-design.md)
- [Role-Based Access Control & Permissions](docs/role-permissions.md)
- [Issue Lifecycle & State Transitions](docs/issue-workflow.md)
- [Phase-Wise Implementation Plan](docs/implementation-plan.md)
