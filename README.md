# FixMySchool

## School Facility Condition Reporting & Repair Tracking Portal

FixMySchool is a full-stack web application designed to simplify the reporting, management, and tracking of school facility-related issues.

The system provides a centralized platform where students and staff can report infrastructure problems, administrators can review and assign issues, and maintenance personnel can update the repair status until the issue is resolved.

---

## Table of Contents

- [Project Overview](#project-overview)
- [Problem Statement](#problem-statement)
- [Project Objectives](#project-objectives)
- [Key Features](#key-features)
- [User Roles](#user-roles)
- [Application Workflow](#application-workflow)
- [Technology Stack](#technology-stack)
- [Project Architecture](#project-architecture)
- [Project Structure](#project-structure)
- [Database Design](#database-design)
- [API Endpoints](#api-endpoints)
- [Environment Variables](#environment-variables)
- [Installation and Setup](#installation-and-setup)
- [Running the Application](#running-the-application)
- [Testing the API](#testing-the-api)
- [Deployment](#deployment)
- [Security Features](#security-features)
- [Advantages](#advantages)
- [Limitations](#limitations)
- [Future Enhancements](#future-enhancements)
- [Contributing](#contributing)
- [License](#license)
- [Project Links](#project-links)

---

## Project Overview

Schools regularly face facility-related problems such as:

- Broken desks and chairs
- Damaged doors and windows
- Faulty lights and fans
- Electrical issues
- Water leakage
- Unclean washrooms
- Damaged laboratory equipment
- Poor classroom infrastructure
- Playground maintenance problems
- Other campus-related issues

In many institutions, these problems are reported verbally or through informal communication. This can lead to delayed action, missing records, unclear responsibility, and difficulty tracking repair progress.

FixMySchool solves this problem by providing a digital issue-management platform. Users can submit complaints with relevant details and attachments, while administrators can monitor, assign, and update each issue through a structured repair workflow.

---

## Problem Statement

Traditional facility complaint systems have several limitations:

1. Complaints may be reported verbally and not recorded properly.
2. Administrators may not have a centralized list of facility problems.
3. Maintenance tasks may not be assigned to the correct person.
4. Users may not know the current status of their complaints.
5. Urgent issues may be overlooked.
6. There may be no proper history of completed repairs.
7. Manual tracking makes it difficult to evaluate maintenance performance.

FixMySchool addresses these challenges through a centralized, role-based, and database-driven web application.

---

## Project Objectives

The main objectives of this project are:

- To provide an easy-to-use platform for reporting school facility problems.
- To maintain a centralized database of all reported issues.
- To allow administrators to review and manage complaints.
- To assign issues to maintenance personnel.
- To track the status of each issue from reporting to resolution.
- To allow users to monitor the progress of their complaints.
- To improve communication between users, administrators, and maintenance staff.
- To reduce delays in facility maintenance.
- To maintain a digital history of reported and resolved issues.
- To provide dashboard-based insights into facility conditions.

---

## Key Features

### 1. User Registration and Login

- New users can create an account.
- Existing users can log in securely.
- JWT-based authentication is used for protected routes.
- User sessions are maintained using browser storage.
- Unauthorized users cannot access protected application pages.

### 2. Facility Issue Reporting

Users can report facility problems by providing:

- Issue title
- Detailed description
- Facility category
- Location
- Priority
- Supporting image or attachment
- Additional information about the issue

### 3. Issue Management

Administrators can:

- View all reported issues.
- Review issue details.
- Change issue priority.
- Update issue status.
- Assign issues to maintenance personnel.
- Monitor pending and completed issues.
- Manage reported facility problems.

### 4. Repair Status Tracking

Each issue can move through different stages of the repair process:

```text
Reported
   ↓
Under Review
   ↓
Assigned
   ↓
In Progress
   ↓
Resolved
   ↓
Closed
```

This workflow provides transparency and allows users to understand the progress of their complaints.

### 5. Dashboard

The dashboard provides an overview of facility issues, including:

- Total number of issues
- Pending issues
- Issues under review
- Assigned issues
- Issues in progress
- Resolved issues
- Issue categories
- Priority-based statistics
- Recent reports

### 6. Notifications

The notification system can inform users about important issue updates, such as:

- Issue submission
- Issue assignment
- Status changes
- Issue resolution
- Additional action requirements

### 7. Role-Based Access Control

The application provides different permissions based on the user role.

- Regular users can report and track their own issues.
- Administrators can manage users and all reported issues.
- Maintenance personnel can view assigned issues and update repair progress.

### 8. File and Image Uploads

Users can attach images or supporting files to their reports. These attachments help administrators and maintenance personnel understand the reported problem more accurately.

### 9. Responsive User Interface

The application is designed to work on:

- Desktop computers
- Laptops
- Tablets
- Mobile devices

The interface adapts to different screen sizes, including the login page, forms, dashboards, and issue-management pages.

### 10. Centralized Error Handling

The backend includes centralized error-handling middleware to provide consistent responses for:

- Invalid requests
- Unauthorized access
- Missing resources
- Database errors
- Unexpected server errors

---

## User Roles

### Regular User

A regular user can:

- Register an account.
- Log in to the application.
- Report a facility issue.
- Upload supporting images.
- View submitted issues.
- Track issue status.
- View issue details.
- Receive notifications.
- Monitor resolved complaints.

### Administrator

An administrator can:

- View all reported issues.
- Review issue details.
- Manage users.
- Assign issues to maintenance personnel.
- Change issue priority.
- Update issue status.
- Monitor dashboard statistics.
- Manage notifications.
- Track repair progress.

### Maintenance Personnel

Maintenance personnel can:

- View assigned issues.
- Review issue descriptions.
- View uploaded attachments.
- Update repair progress.
- Mark issues as resolved.
- Add relevant repair information.

---

## Application Workflow

```text
User registers or logs in
          |
          v
User reports a facility issue
          |
          v
Issue is stored in MongoDB
          |
          v
Administrator reviews the issue
          |
          v
Issue is assigned to maintenance personnel
          |
          v
Maintenance personnel starts the repair
          |
          v
Issue status is updated to In Progress
          |
          v
Repair is completed
          |
          v
Issue is marked as Resolved or Closed
          |
          v
User receives an updated notification
```

---

## Technology Stack

### Frontend

- React.js
- Vite
- JavaScript
- HTML5
- CSS3
- Axios
- React Router
- Responsive design

### Backend

- Node.js
- Express.js
- JavaScript
- RESTful APIs
- JSON Web Token
- Middleware-based request handling

### Database

- MongoDB
- Mongoose
- MongoDB Atlas

### Deployment and Hosting

- Vercel
- GitHub
- MongoDB Atlas

### Development Tools

- Visual Studio Code
- Git
- GitHub
- npm
- Postman
- MongoDB Atlas
- Vercel

---

## Project Architecture

FixMySchool follows a client-server architecture.

```text
                    React Frontend
                          |
                          | HTTP Requests using Axios
                          v
                    Express Backend
                          |
              Authentication and Authorization
                          |
                   Business Logic
                          |
                          v
                    MongoDB Database
```

### Frontend Layer

The frontend is responsible for:

- User interface
- Navigation
- Authentication pages
- Issue-reporting forms
- Dashboards
- Issue cards
- Notifications
- API communication

### Backend Layer

The backend is responsible for:

- User registration and login
- JWT authentication
- Role-based authorization
- Issue creation and management
- Notification management
- Dashboard statistics
- File uploads
- Database communication
- Error handling

### Database Layer

MongoDB stores:

- User information
- Reported issues
- Issue assignments
- Issue status
- Notifications
- Uploaded file references

---

## Project Structure

```text
school-facility-portal/
│
├── api/
│   └── index.js
│
├── backend/
│   │
│   ├── config/
│   │   └── db.js
│   │
│   ├── controllers/
│   │   ├── adminController.js
│   │   ├── authController.js
│   │   ├── dashboardController.js
│   │   ├── issueController.js
│   │   └── notificationController.js
│   │
│   ├── middleware/
│   │   ├── authMiddleware.js
│   │   ├── errorHandler.js
│   │   └── uploadMiddleware.js
│   │
│   ├── models/
│   │   ├── Issue.js
│   │   ├── Notification.js
│   │   └── User.js
│   │
│   ├── routes/
│   │   ├── adminRoutes.js
│   │   ├── authRoutes.js
│   │   ├── dashboardRoutes.js
│   │   ├── issueRoutes.js
│   │   ├── notificationRoutes.js
│   │   └── uploadRoutes.js
│   │
│   ├── utils/
│   │   └── ensureDefaultAdmin.js
│   │
│   ├── package.json
│   └── server.js
│
├── frontend/
│   │
│   ├── public/
│   │
│   ├── src/
│   │   ├── api/
│   │   │   └── axios.js
│   │   │
│   │   ├── components/
│   │   │   ├── Navbar.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   ├── IssueCard.jsx
│   │   │   └── ProtectedRoute.jsx
│   │   │
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── ReportIssue.jsx
│   │   │   ├── MyIssues.jsx
│   │   │   ├── IssueDetails.jsx
│   │   │   ├── Notifications.jsx
│   │   │   └── AdminDashboard.jsx
│   │   │
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   │
│   ├── package.json
│   └── vite.config.js
│
├── .gitignore
├── vercel.json
└── README.md
```

> The exact file names may vary slightly depending on the current implementation of the project.

---

## Database Design

### User Collection

The User collection stores account details and role information.

```text
_id
name
email
password
role
createdAt
updatedAt
```

Possible user roles include:

```text
user
admin
maintenance
```

### Issue Collection

The Issue collection stores all facility-related complaints.

```text
_id
title
description
category
location
priority
status
reportedBy
assignedTo
attachments
createdAt
updatedAt
```

### Notification Collection

The Notification collection stores notifications generated during the issue lifecycle.

```text
_id
user
message
type
isRead
relatedIssue
createdAt
```

### Database Relationships

```text
User
 ├── Reports many Issues
 ├── Receives many Notifications
 └── May be assigned many Issues

Issue
 ├── Belongs to one reporting User
 ├── May be assigned to one maintenance User
 └── May generate multiple Notifications
```

---

## API Endpoints

The backend API is available under:

```text
/api
```

### Health Check

```http
GET /api/health
```

Returns the current status of the backend server.

### Authentication Routes

```http
POST /api/auth/register
POST /api/auth/login
GET  /api/auth/me
```

### Issue Routes

```http
GET    /api/issues
GET    /api/issues/:id
POST   /api/issues
PUT    /api/issues/:id
DELETE /api/issues/:id
```

### Notification Routes

```http
GET /api/notifications
PUT /api/notifications/:id/read
```

### Dashboard Routes

```http
GET /api/dashboard
```

### Admin Routes

```http
GET    /api/admin/users
PUT    /api/admin/users/:id
DELETE /api/admin/users/:id
```

### Upload Routes

```http
POST /api/uploads
```

> Some endpoints require a valid JWT token and appropriate user permissions.

---

## Authentication and Authorization

FixMySchool uses JSON Web Tokens for authentication.

### Authentication Process

1. A user registers or logs in.
2. The backend validates the submitted credentials.
3. A JWT token is generated.
4. The frontend stores the token in browser storage.
5. Axios attaches the token to protected API requests.
6. The backend verifies the token.
7. Access is granted according to the user’s role.

Protected requests use the following header:

```http
Authorization: Bearer <token>
```

---

## Environment Variables

### Backend Environment Variables

Create a `.env` file inside the `backend` directory.

```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_secure_jwt_secret
CLIENT_ORIGIN=http://localhost:5173
```

If the backend configuration uses `MONGO_URI` instead of `MONGODB_URI`, use the variable name defined in `backend/config/db.js`.

### Frontend Environment Variables

Create a `.env.local` file inside the `frontend` directory.

```env
VITE_API_URL=http://localhost:5000/api
```

For production:

```env
VITE_API_URL=https://fix-backend-eosin.vercel.app/api
```

### Environment Variable Security

- Do not commit `.env` files to GitHub.
- Do not expose `JWT_SECRET` in the frontend.
- Variables beginning with `VITE_` are exposed to the browser.
- MongoDB credentials must only be stored in backend environment variables.
- Environment variables added to Vercel require a new deployment.
- MongoDB Atlas must allow connections from the deployed backend.

---

## Installation and Setup

### Prerequisites

Make sure the following software is installed:

- Node.js
- npm
- Git
- MongoDB Atlas account or local MongoDB
- Visual Studio Code
- Postman, optional for API testing

### Clone the Repository

```bash
git clone https://github.com/Kaurgxg/FixMySchool.git
```

Navigate into the project directory:

```bash
cd FixMySchool
```

---

## Backend Setup

Navigate to the backend directory:

```bash
cd backend
```

Install backend dependencies:

```bash
npm install
```

Create a `.env` file inside the backend directory:

```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_secure_jwt_secret
CLIENT_ORIGIN=http://localhost:5173
```

Start the backend server:

```bash
npm run dev
```

If a development script is not available, use:

```bash
node server.js
```

The backend will run at:

```text
http://localhost:5000
```

---

## Frontend Setup

Open a new terminal and navigate to the frontend directory:

```bash
cd frontend
```

Install frontend dependencies:

```bash
npm install
```

Create a `.env.local` file:

```env
VITE_API_URL=http://localhost:5000/api
```

Start the frontend development server:

```bash
npm run dev
```

The frontend will usually run at:

```text
http://localhost:5173
```

---

## Running the Application

Run the backend and frontend in separate terminals.

### Terminal 1 — Backend

```bash
cd backend
npm run dev
```

### Terminal 2 — Frontend

```bash
cd frontend
npm run dev
```

Open the frontend in your browser:

```text
http://localhost:5173
```

---

## Testing the API

The backend health endpoint can be tested using a browser or Postman.

### Local Health Check

```http
GET http://localhost:5000/api/health
```

### Production Health Check

```http
GET https://fix-backend-eosin.vercel.app/api/health
```

Expected response:

```json
{
  "status": "ok",
  "message": "School Facility Portal API is running."
}
```

For authentication routes, use Postman or the frontend because registration and login require specific HTTP methods.

For example:

```http
POST /api/auth/register
```

Opening this URL directly in a browser sends a `GET` request, which may result in a route-not-found response.

---

## Deployment

### Frontend Deployment

The frontend is deployed using Vercel.

Production frontend:

```text
https://fixmyschool.vercel.app/
```

Add the following environment variable in the frontend Vercel project:

```env
VITE_API_URL=https://fix-backend-eosin.vercel.app/api
```

After adding or updating the variable, redeploy the frontend.

### Backend Deployment

The backend is deployed using Vercel serverless functions.

Production backend:

```text
https://fix-backend-eosin.vercel.app/
```

Add the following environment variables in the backend Vercel project:

```env
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_secure_jwt_secret
CLIENT_ORIGIN=https://fixmyschool.vercel.app
```

### Deployment Steps

```bash
git add .
git commit -m "Update project"
git push origin main
```

If GitHub is connected to Vercel, pushing changes to the `main` branch automatically triggers a new deployment.

---

## Security Features

The application includes the following security measures:

- JWT-based authentication
- Protected API routes
- Role-based authorization
- Password hashing
- Environment-based secret management
- CORS configuration
- Request validation
- Centralized error handling
- Authentication token verification
- Restricted administrative operations

---

## Advantages

- Reduces dependency on manual complaint reporting.
- Provides a centralized record of facility issues.
- Improves communication between users and administrators.
- Provides transparent issue-status tracking.
- Prevents complaints from being lost.
- Helps administrators prioritize urgent problems.
- Improves maintenance accountability.
- Maintains a history of reported and resolved issues.
- Supports desktop and mobile devices.
- Provides dashboard-based monitoring.
- Can be expanded to support multiple schools and campuses.

---

## Limitations

The current version may have the following limitations:

- Real-time notifications may not be implemented.
- Maintenance assignment may depend on administrator actions.
- Advanced analytics may be limited.
- Email and SMS notifications may not be available.
- File storage may require additional cloud-storage configuration.
- The application may currently be configured for a single school or institution.

---

## Future Enhancements

### 1. Real-Time Notifications

Implement WebSockets or Socket.IO to notify users immediately when issue statuses change.

### 2. Email and SMS Alerts

Send automatic alerts when:

- An issue is assigned.
- A repair is delayed.
- An issue is resolved.
- A high-priority complaint is created.

### 3. Advanced Analytics

Add charts and reports for:

- Average resolution time
- Most common issue categories
- Maintenance team performance
- Monthly complaint trends
- Frequently affected locations

### 4. AI-Based Issue Classification

An AI system could analyze issue descriptions and automatically:

- Identify the issue category.
- Estimate issue priority.
- Detect duplicate complaints.
- Suggest the responsible department.
- Generate a short issue summary.

### 5. Multiple School Support

Extend the platform to support:

- Multiple schools
- Multiple campuses
- School-specific administrators
- Institution-level reports

### 6. Detailed Repair History

Maintain a complete history of:

- Status changes
- Assigned personnel
- Repair comments
- Completion dates
- Uploaded evidence

### 7. Mobile Application

Develop a dedicated mobile application for faster issue reporting and image uploads.

### 8. Location-Based Reporting

Allow users to select a building, classroom, laboratory, washroom, or other facility directly from a school map.

### 9. Automated Priority Detection

Automatically identify urgent issues based on:

- Safety risks
- Number of affected users
- Facility category
- Issue severity
- Frequency of reports

---

## Contributing

Contributions are welcome.

### Step 1: Fork the Repository

Fork the project repository on GitHub.

### Step 2: Clone Your Fork

```bash
git clone https://github.com/your-username/FixMySchool.git
cd FixMySchool
```

### Step 3: Create a New Branch

```bash
git checkout -b feature/your-feature-name
```

### Step 4: Make Your Changes

Implement the required feature or fix.

### Step 5: Test the Application

Run both the frontend and backend locally and verify that the changes work correctly.

### Step 6: Commit Your Changes

```bash
git add .
git commit -m "Add your feature"
```

### Step 7: Push Your Branch

```bash
git push origin feature/your-feature-name
```

### Step 8: Create a Pull Request

Open a pull request on GitHub with a clear description of your changes.

---

## License

This project is developed for educational and academic purposes.

You may modify and extend the project according to your institution’s requirements.

---

## Project Links

- GitHub Repository: https://github.com/Kaurgxg/FixMySchool
- Live Frontend: https://fixmyschool.vercel.app/
- Backend API: https://fix-backend-eosin.vercel.app/
- Backend Health Check: https://fix-backend-eosin.vercel.app/api/health

---

## Project Summary

FixMySchool is a centralized school facility-management platform that enables users to report infrastructure problems and track their resolution.

By combining issue reporting, administrator management, maintenance assignment, notifications, and dashboard analytics, the system improves transparency, accountability, and efficiency in school facility maintenance.
