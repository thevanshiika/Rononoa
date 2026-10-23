# SynergyHub — Collaborative Project Management Platform (MERN)

A production-grade, multi-user project management platform engineered with the **MERN** stack (MongoDB, Express.js, React.js, Node.js) featuring server-enforced Role-Based Access Control (RBAC), real-time **Optimistic Concurrency Control (OCC)**, and interactive demo workspace tooling for hackathons and academic evaluations.

---

## 📋 Table of Contents
1. [Project Overview & Architecture](#-project-overview--architecture)
2. [Seeded Demo Accounts & College Initiatives](#-seeded-demo-accounts--college-initiatives)
3. [Windows & PowerShell Local Setup Guide](#-windows--powershell-local-setup-guide)
4. [Startup Modes & Scripts](#-startup-modes--scripts)
5. [Database Architecture & OCC Details](#-database-architecture--occ-details)
6. [Role-Based Access Control (RBAC)](#-role-based-access-control-rbac)
7. [REST API Documentation](#-rest-api-documentation)
8. [GitHub Repository Publication Guide](#-github-repository-publication-guide)
9. [Vercel Production Deployment Guide](#-vercel-production-deployment-guide)
10. [Automated Verification Results](#-automated-verification-results)

---

## 🏛️ Project Overview & Architecture

SynergyHub is structured as a full-stack JavaScript / TypeScript MERN application:

```
synergyhub/
├── .env.example              # Example environment configuration (never commit secrets)
├── .gitignore                # Production ignore rules (excludes .env, dist, node_modules)
├── index.html                # Vite SPA HTML entry point
├── package.json              # Root dependencies and orchestrator scripts
├── tsconfig.json             # Root TypeScript compiler options
├── vercel.json               # Vercel serverless routing and SPA history fallback rewrites
├── vite.config.ts            # Vite client config with dev proxy to port 5000
│
├── api/                      # Vercel Serverless Function entry point
│   └── index.ts              # Serverless handler with cached Mongoose connection
│
├── server/                   # Backend Express & MongoDB Engine
│   ├── scripts/
│   │   └── seed.ts           # Standalone MongoDB seeding script
│   └── src/
│       ├── app.ts            # Express application factory & middleware
│       ├── server.ts         # Standalone backend server (runs on port 5000)
│       ├── config/
│       │   └── db.ts         # MongoDB connection with serverless caching & embedded fallback
│       ├── controllers/      # Route controllers (Auth, Project, Task, Comment, Demo, User)
│       ├── middleware/       # RBAC auth and membership verification
│       ├── models/           # Mongoose schemas (User, Project, Task, Comment)
│       ├── routes/           # REST API route endpoints
│       ├── scripts/          # Auto-seeding logic
│       ├── utils/            # JWT signing and bcrypt helpers
│       └── validators/       # Zod schema validation
│
└── src/                      # Frontend React 19 Client
    ├── api/
    │   └── client.ts         # Axios client with VITE_API_BASE_URL support
    ├── components/           # UI components (Kanban boards, metrics, modals, layouts)
    ├── context/              # Authentication and active workspace React context
    ├── pages/                # Route pages (Login, Dashboard, Projects, Tasks, Users, Profile)
    └── types/                # Frontend TypeScript interfaces
```

---

## 🎓 Seeded Demo Accounts & College Initiatives

### 1-Click Demo Accounts (Password for all: `Password123!`)

> **Note**: These demo accounts and credentials are strictly intended for local development, hackathon demos, and evaluation. In production, real accounts should use unique passwords and configured environment secrets.

| Role | Name | Email | Persona & Responsibilities |
| :--- | :--- | :--- | :--- |
| **Admin** | Alex Rivera | `admin@company.com` | **Hackathon Director**: Full administrative power, user provisioning, global project oversight |
| **Project Manager** | Sarah Chen | `pm@company.com` | **Lead Student Tech Coordinator**: Manages assigned projects, invites friends, coordinates tasks |
| **Team Member** | Marcus Vance | `dev@company.com` | **Senior Student Engineer**: Works on assigned tasks, advances status, tests atomic OCC |
| **Faculty Judge (Viewer)** | Elena Rostova | `viewer@company.com` | **Faculty Advisor & Judge**: Read-only evaluation access to inspect projects and metrics |
| **Team Member** | Liam Sato | `designer@company.com` | **UI/UX Designer**: Manages design system tasks and dark mode implementations |
| **Team Member** | Maya Patel | `qa@company.com` | **QA Specialist**: Test automation, rubric validation, integration tests |
| **Team Member** | Devon Brooks | `devon@company.com` | **Cloud Engineer**: Docker container scaling, deployment automation |

### 4 Seeded College Hackathon Projects
1. **College Hackathon Platform**: Submission portal, automated rubric scoring, real-time leaderboard backend.
2. **Student Collaboration Portal**: Academic networking hub, peer code reviews, shared digital study rooms.
3. **Portfolio Website Redesign**: Student portfolio directory, responsive dark mode with Tailwind CSS.
4. **Campus Event Management**: Annual tech symposium ticketing, schedule tracker, volunteer shifts.

---

## 💻 Windows & PowerShell Local Setup Guide

Follow these beginner-friendly steps to run SynergyHub on a local Windows machine.

### Step 1: Prerequisites
Make sure you have installed on Windows:
1. **Node.js (v18 or higher)**: [nodejs.org](https://nodejs.org)
2. **Git for Windows**: [git-scm.com](https://git-scm.com)
3. *(Optional)* **MongoDB Community Server**: [mongodb.com/try/download/community](https://www.mongodb.com/try/download/community)  
   *If you do not have MongoDB installed or running, SynergyHub automatically launches its embedded in-memory MongoDB engine, so you can run the app immediately with zero configuration!*

### Step 2: Clone or Open Project in PowerShell
Open **Windows PowerShell** or **Command Prompt** in the project folder:
```powershell
# Navigate to the project directory
cd synergyhub

# Install all dependencies (concurrently, express, mongoose, react, vite, etc.)
npm install
```

### Step 3: Configure Environment Variables
Copy `.env.example` to create your local `.env`:
```powershell
Copy-Item .env.example .env
```

The default `.env` will look like this:
```env
SERVER_PORT=5000
CLIENT_PORT=5173
PORT=3000
MONGODB_URI=mongodb://127.0.0.1:27017/synergyhub
JWT_SECRET=synergyhub_local_development_jwt_secret_key_2026
JWT_EXPIRES_IN=7d
CLIENT_ORIGIN=http://localhost:5173
VITE_API_BASE_URL=/api
VITE_BACKEND_URL=http://localhost:5000
NODE_ENV=development
```

### Step 4: Seed the Database
Populate the database with the 7 demo accounts, 4 college initiatives, ~20 tasks, and discussion threads:
```powershell
npm run seed
```

---

## 🚀 Startup Modes & Scripts

SynergyHub provides 3 convenient ways to run locally on Windows:

### Option A: Standard Local Development (Frontend 5173 + Backend 5000 Concurrently)
This starts both the Express API server on `http://localhost:5000` and the Vite client on `http://localhost:5173` using `concurrently`:
```powershell
npm run dev:local
```
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:5000/api`
- Health check: `http://localhost:5000/api/health`

### Option B: Separate Terminal Windows (Clean debugging)
**Terminal 1 (Backend API):**
```powershell
npm run dev:server
```
*Listens on port 5000, connects to MongoDB `mongodb://127.0.0.1:27017/synergyhub` (or embedded fallback).*

**Terminal 2 (Frontend Client):**
```powershell
npm run dev:client
```
*Listens on port 5173, proxies `/api` requests to `http://localhost:5000` automatically.*

### Option C: Unified Single-Server Dev Mode
```powershell
npm run dev
```
*Mounts Vite middlewares inside Express on `http://localhost:3000`.*

---

## 🔒 Database Architecture & OCC Details

### Atomic Optimistic Concurrency Control (OCC)
In high-velocity collaborative environments, simultaneous task edits can overwrite each other. SynergyHub enforces strict optimistic locking at the database level:

1. Every task document includes a positive integer `version` field (starting at `1`).
2. When any client saves a task, it must submit the task's current `version`.
3. The Express controller performs an atomic find-and-modify using MongoDB's `$inc` operator:
   ```typescript
   const updatedTask = await Task.findOneAndUpdate(
     { _id: taskId, version: submittedVersion },
     { 
       $set: updateFields, 
       $inc: { version: 1 } 
     },
     { new: true, runValidators: true }
   );
   ```
4. If the version matches, MongoDB atomically applies the changes and increments `version` by 1.
5. If another user has updated the task in the meantime, the query matches 0 documents and returns `HTTP 409 Conflict` along with the latest task payload from the database.
6. The frontend shows a non-destructive conflict recovery dialog with a **"Reload Latest Version"** action.

---

## 🛡️ Role-Based Access Control (RBAC)

SynergyHub enforces permissions server-side across all controllers:

| Feature / Action | Admin | Project Manager | Team Member | Viewer |
| :--- | :---: | :---: | :---: | :---: |
| View Assigned Projects & Tasks | ✅ | ✅ | ✅ | ✅ (Read-Only) |
| Global Project Oversight | ✅ | Assigned Only | Assigned Only | Assigned Only |
| Create New Projects | ✅ | ✅ | ❌ (403) | ❌ (403) |
| Archive Projects | ✅ | Assigned Only | ❌ (403) | ❌ (403) |
| Provision New Friend Accounts | ✅ | ❌ (403) | ❌ (403) | ❌ (403) |
| Add Existing Users to Project Team | ✅ | ✅ | ❌ (403) | ❌ (403) |
| Create Tasks | ✅ | ✅ | ✅ (Assigned) | ❌ (403) |
| Update Assigned Task Status & Hours | ✅ | ✅ | ✅ | ❌ (403) |
| Delete Tasks | ✅ | ✅ | ❌ (403) | ❌ (403) |
| Post Comments | ✅ | ✅ | ✅ | ❌ (403) |
| User Directory & Account Deactivation | ✅ | ❌ (403) | ❌ (403) | ❌ (403) |

Direct unauthorized API calls return `HTTP 403 Forbidden` (`HTTP 401 Unauthorized` if unauthenticated).

---

## 📡 REST API Documentation

### Authentication & Self-Profile
- `POST /api/auth/login`: Authenticate with email and password (`{ email, password }`).
- `GET /api/auth/me`: Retrieve current session user and privileges.
- `PATCH /api/auth/profile`: Update personal profile and credentials.

### Users (Admin Only)
- `GET /api/users`: List users with search, role, and department filters.
- `POST /api/users`: Provision a new user account.
- `PATCH /api/users/:id`: Edit user details and global role.
- `PATCH /api/users/:id/deactivate`: Toggle account active / inactive status.

### Projects
- `GET /api/projects`: List accessible projects with computed progress metrics.
- `POST /api/projects`: Create a new project.
- `GET /api/projects/:id`: Get project overview and task progress statistics.
- `PATCH /api/projects/:id`: Update project details.
- `PATCH /api/projects/:id/archive`: Toggle project archived status.

### Team Members
- `GET /api/projects/:id/team`: Retrieve project team members and project-level roles.
- `POST /api/projects/:id/team`: Add a member to the project or provision a friend account.
- `PATCH /api/projects/:id/team/:userId`: Update member project role.
- `DELETE /api/projects/:id/team/:userId`: Remove member and unassign their active tasks.

### Tasks & Concurrency
- `GET /api/tasks/stats/dashboard`: Global project velocity and status breakdown.
- `POST /api/tasks`: Create a task for a project.
- `GET /api/projects/:id/tasks`: List tasks for a specific project.
- `GET /api/tasks/:id`: Get task details with version counter.
- `PATCH /api/tasks/:id`: Update task with version check (`HTTP 409 Conflict` on mismatch).
- `DELETE /api/tasks/:id`: Delete a task (PM or Admin only).

### Comments
- `GET /api/comments/task/:id`: Fetch chronological discussion comments.
- `POST /api/comments`: Add a comment (`{ task, content }`).
- `DELETE /api/comments/:id`: Delete a comment.

### Demo Workspace
- `GET /api/demo/info`: Status of demo data vs custom data.
- `POST /api/demo/reset`: Safe reset with optional `{ retainCustomData: true }`.

---

## 🐙 GitHub Repository Publication Guide

Follow these exact Windows PowerShell commands to publish SynergyHub to your GitHub account:

### 1. Verify Git Status & Ignore Rules
Check that `.env` files and `node_modules` are excluded:
```powershell
git status
```
*(Ensure `.env` does **not** appear under Untracked files).*

### 2. Initialize and Commit
```powershell
# Initialize git if not already initialized
git init

# Stage all files
git add .

# Create the initial commit
git commit -m "feat: complete SynergyHub MERN platform with local Windows support and Vercel serverless deployment"
```

### 3. Create a New Repository on GitHub
1. Log in to [github.com](https://github.com).
2. Click **New Repository**.
3. Name your repository (e.g., `synergyhub-mern`).
4. Set visibility to **Public** or **Private**.
5. Do **not** check "Initialize with README" (we already have a complete README).
6. Click **Create repository**.

### 4. Link & Push from PowerShell
Replace `YOUR_USERNAME` and `YOUR_REPO_NAME` with your actual GitHub details:
```powershell
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git push -u origin main
```

---

## ⚡ Vercel Production Deployment Guide

Vercel provides native support for modern Vite frontends and Node.js serverless functions.

### Architecture on Vercel: Single Unified Project (Recommended)
SynergyHub is configured to deploy as a **single unified project** on Vercel:
- **Frontend**: Vite builds to `dist/`.
- **Backend API**: The `/api/index.ts` serverless handler intercepts `/api/*` requests and executes the Express app.
- **Routing**: `vercel.json` provides URL rewrites for `/api/(.*)` to `/api/index.ts` and falls back all other client routes to `/index.html` (preventing 404s on browser refresh).

### Step 1: Set Up MongoDB Atlas (Cloud Database)
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) and create a free M0 cluster.
2. In **Database Access**, create a database user (e.g., `synergyhub_user`) with read/write privileges.
3. In **Network Access**, click **Add IP Address** and choose **Allow Access From Anywhere (`0.0.0.0/0`)** so Vercel's serverless functions can connect.
4. Click **Connect** → **Drivers** (Node.js) and copy your connection string:
   ```
   mongodb+srv://<username>:<password>@cluster0.abcde.mongodb.net/synergyhub?retryWrites=true&w=majority
   ```

### Step 2: Deploy to Vercel via Dashboard or CLI
#### Option 1: Via Vercel Web Dashboard (Easiest)
1. Go to [vercel.com](https://vercel.com) and click **Add New... → Project**.
2. Import your GitHub repository (`synergyhub-mern`).
3. Keep default settings:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Expand **Environment Variables** and add:

| Variable Name | Example Production Value |
| :--- | :--- |
| `MONGODB_URI` | `mongodb+srv://user:pass@cluster0.xyz.mongodb.net/synergyhub?retryWrites=true&w=majority` |
| `JWT_SECRET` | `generate_a_random_32_character_string_here` |
| `JWT_EXPIRES_IN` | `7d` |
| `NODE_ENV` | `production` |
| `VITE_API_BASE_URL` | `/api` |

5. Click **Deploy**. Vercel will build the frontend into `dist` and deploy the serverless functions in `/api`.

#### Option 2: Via Vercel CLI (PowerShell)
```powershell
# Install Vercel CLI
npm install -g vercel

# Log in
vercel login

# Deploy
vercel --prod
```

### Step 3: Seed Production Database
Once deployed, seed your production MongoDB Atlas database from your local PowerShell terminal by passing your Atlas URI:
```powershell
$env:MONGODB_URI="mongodb+srv://user:pass@cluster0.xyz.mongodb.net/synergyhub?retryWrites=true&w=majority"
npm run seed
```

---

## ✅ Automated Verification Results

Every core feature and permission constraint was executed against the running backend and MongoDB engine.

| # | Test Scenario | Method / Route | HTTP Status | Result |
| :--- | :--- | :--- | :---: | :--- |
| 1 | Server Health Check | `GET /api/health` | **200 OK** | `{"status": "healthy"}` |
| 2a | Administrator Login | `POST /api/auth/login` | **200 OK** | JWT token issued; Role: `admin` |
| 2b | Viewer / Evaluator Login | `POST /api/auth/login` | **200 OK** | JWT token issued; Role: `viewer` |
| 3 | Retrieve Project Catalog | `GET /api/projects` | **200 OK** | Successfully listed seeded projects |
| 4a | Create Project (Admin) | `POST /api/projects` | **201 Created** | Project persisted in MongoDB |
| 4b | Get Project Details by ID | `GET /api/projects/:id` | **200 OK** | Retrieved overview & task metrics |
| 4c | Update Project Details | `PATCH /api/projects/:id` | **200 OK** | Changes saved to MongoDB |
| 5a | Provision Friend & Assign | `POST /api/projects/:id/members` | **201 Created** | Account created & linked to roster |
| 5b | Fetch Project Team Roster | `GET /api/projects/:id/team` | **200 OK** | Verified team membership count |
| 6a | Create Task with Version 1 | `POST /api/tasks` | **201 Created** | Task created; Initial `version: 1` |
| 6b | Update Task with Valid Version | `PATCH /api/tasks/:id` | **200 OK** | Applied changes; Atomically incremented to `version: 2` |
| 6c | Stale Version OCC Update | `PATCH /api/tasks/:id` | **409 Conflict** | Rejected stale submission; Returned latest task |
| 7a | Post Task Comment | `POST /api/comments` | **201 Created** | Comment appended to task thread |
| 7b | Fetch Task Comments | `GET /api/comments/task/:id` | **200 OK** | Chronological comments retrieved |
| 8a | Viewer Blocked from Project Create | `POST /api/projects` | **403 Forbidden** | RBAC blocked write attempt |
| 8b | Viewer Blocked from Task Create | `POST /api/tasks` | **403 Forbidden** | RBAC blocked write attempt |

---

## 📄 License
SynergyHub is open-source and released under the MIT License.
