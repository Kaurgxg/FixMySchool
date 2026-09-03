# Project Requirements Document (PRD)
## School Facility Condition Reporting & Repair Tracking Portal ("FixMySchool")

**Prepared for:** Unified Mentor Internship Program
**Status:** Phase 1 — Implemented

---

## 1. Context & Background

Many schools face infrastructure issues such as broken furniture, unsafe classrooms,
damaged toilets, poor sanitation, and electrical hazards. These problems often go
unreported or unresolved due to the lack of a structured reporting system.

**Key challenges:**
- No centralized system to report facility issues
- Delayed response and repair tracking
- Lack of transparency in issue resolution
- Limited communication between parents, teachers, and administration

**Relevant frameworks/standards referenced:**
- Ministry of Education – School infrastructure policies and educational standards
- Samagra Shiksha Abhiyan – School development and infrastructure improvement initiative
- UNICEF – Child-friendly school environments and infrastructure support

## 2. Problem Statement

- Poor visibility of school infrastructure issues
- Delayed maintenance and repairs
- Lack of accountability in issue resolution
- Inefficient communication among stakeholders

## 3. Objectives

**Primary**
- Enable easy reporting of facility issues
- Track repair progress and status
- Improve transparency and accountability
- Ensure timely maintenance actions
- Enhance student safety

**Secondary**
- Encourage parent and teacher participation
- Improve school infrastructure quality
- Digitize maintenance management
- Support better governance

## 4. Scope

**In Scope (Phase 1) — ✅ Implemented**
- User registration and login (Parent / Teacher / Admin roles)
- Issue reporting system (with photo upload)
- Repair tracking dashboard (status + timeline)
- Notification system
- Admin management panel

**Out of Scope (Phase 1)** — see Section 9, Future Enhancements
- Integration with government maintenance systems
- Automated repair scheduling
- Mobile application version
- AI-based issue detection

## 5. Functional Requirements

### 5.1 User Module (Parents/Teachers)
- Register and log in
- Report infrastructure issues
- Upload images of problems
- Track issue status
- Receive updates (notifications)

### 5.2 Issue Reporting Module
- Submit issue details (title, description, category)
- Upload photos (up to 5 per issue)
- Select location within school
- Assign priority level (Low / Medium / High / Critical)

### 5.3 Repair Tracking Module
- View status: Pending, In Progress, Resolved, Rejected
- Timeline of actions taken on each issue
- Estimated resolution date
- Status-change notifications

### 5.4 Notification Module
- Alerts for status updates
- Notifications for resolved issues
- Read/unread tracking, mark-all-as-read

### 5.5 Dashboard Module
- Overview of reported issues (totals by status)
- Categorized issue tracking (bar breakdown by category)
- Priority-based filtering
- Summary statistics: resolution rate, average resolution time

### 5.6 Admin/School Management Module
- View and manage all reported issues for the school
- Assign repair tasks to staff/vendors with an estimated resolution date
- Update issue status with a note (creates a timeline entry)
- Manage registered users (activate/deactivate accounts)
- Filter/search issues by status, category, priority, keyword

## 6. Non-Functional Requirements

| Requirement | How it's met |
|---|---|
| Secure authentication | JWT tokens + bcrypt password hashing, role-based route guards |
| Responsive, mobile-friendly UI | Tailwind CSS responsive layout, mobile nav |
| Fast, reliable performance | Indexed MongoDB queries (`schoolId`, `status`, `category`), lean REST API |
| Scalable backend architecture | Stateless Express API, MVC structure (models/controllers/routes), horizontally scalable |
| Data privacy and security | Passwords hashed and never returned in API responses; role-based data access (parents/teachers only see their own issues) |

## 7. Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React.js (Vite), Tailwind CSS, React Router, Axios |
| Backend | Node.js with Express.js |
| Database | MongoDB (Mongoose ODM) |
| Media Storage | Local disk via Multer (cloud bucket swap recommended for production — see Section 9) |
| Deployment | Vercel/Netlify (frontend) + Render/Railway (backend) + MongoDB Atlas (database) |

## 8. User Flows

**Parent/Teacher Flow**
1. Register/Login
2. Report issue (with photos)
3. Track status on dashboard / issues list
4. Receive in-app notifications as status changes

**Admin Flow**
1. Log in to Admin Panel
2. View all reported issues (filter by status/category/priority)
3. Assign staff/vendor + set estimated resolution date
4. Update status as work progresses, with a note
5. Monitor school-wide KPIs from the dashboard

## 9. Data Model

**User**
- name, email, password (hashed), role (parent/teacher/admin), schoolId, phone, isActive, timestamps

**Issue**
- issueCode (auto-generated, e.g. `ISS-000001`), title, description, category, location,
  priority, status, images[], schoolId, reportedBy (ref User), assignedStaff,
  estimatedResolutionDate, resolvedAt, timeline[] (status, note, updatedBy, date), timestamps

**Notification**
- user (ref User), issue (ref Issue), message, type, read, timestamps

## 10. Key Performance Indicators (KPIs)

- Number of issues reported
- Average resolution time (computed from `createdAt` → `resolvedAt`)
- Percentage of resolved issues
- User engagement rate (registrations, issues reported per user)
- Satisfaction level (qualitative — future enhancement: post-resolution rating)

## 11. Assumptions & Constraints

**Assumptions**
- Parents and teachers will actively report issues
- Schools are willing to adopt digital systems
- Internet access is available to users

**Constraints**
- Possible resistance to adoption in some schools
- Manual repair processes outside the app may still introduce delay
- Data accuracy depends on user input quality

## 12. Deliverables

- ✅ Fully functional reporting platform (this codebase)
- ✅ Issue reporting and tracking system
- ✅ Notification and dashboard modules
- ✅ Admin panel
- ⬜ Live deployed application link — *to be added after you deploy following `README.md`*
- ✅ This PRD document

## 13. Expected Impact

- Improved visibility into school infrastructure condition
- Faster issue resolution through clear ownership and timelines
- Increased transparency between school administration and families
- Better student safety through faster hazard reporting
- Enhanced community participation in school upkeep

## 14. Future Enhancements (Phase 2+, intentionally out of scope for Phase 1)

- Native mobile application (iOS/Android)
- Integration with government maintenance/reporting systems
- Automated repair scheduling and vendor dispatch
- AI-based issue detection from uploaded photos (image recognition)
- Vendor/service-provider marketplace integration
- Cloud-based image storage (e.g. Cloudinary) for durability across deployments
- Post-resolution satisfaction ratings from reporters
- Email/SMS notifications in addition to in-app alerts

---
*This PRD reflects the system as implemented in Phase 1. Section numbers map directly
to the functional and non-functional requirements implemented in `backend/` and `frontend/`.*
