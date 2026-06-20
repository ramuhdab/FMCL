# FMCL Inventory Management System

> Facility Management Control Layer — Uniform & Equipment Tracking System
> Built for 800 employees across 10 buildings in Hyderabad

---

## Table of Contents

1. [Overview](#overview)
2. [Tech Stack](#tech-stack)
3. [Features](#features)
4. [Project Structure](#project-structure)
5. [Database Schema](#database-schema)
6. [User Roles & Permissions](#user-roles--permissions)
7. [Getting Started (Local)](#getting-started-local)
8. [Exposing Online with ngrok](#exposing-online-with-ngrok)
9. [Default Login Credentials](#default-login-credentials)
10. [Business Rules](#business-rules)
11. [Approval Workflow](#approval-workflow)
12. [Going to Production](#going-to-production)
13. [Backup](#backup)

---

## Overview

FMCL Inventory tracks the issuance and recovery of uniforms and safety equipment to facility management employees. The core problem it solves: **when an employee leaves prematurely, the system automatically calculates how much of the uniform cost should be deducted from their final salary**, based on how long they worked.

Key capabilities:
- Track what was issued to each employee, on which date, in which building
- Calculate salary deductions when employees leave early
- 4-step procurement approval workflow (Tech Manager → Senior Manager → Finance → MD)
- Low stock alerts when inventory drops below threshold (default: 20 units)
- Full vendor management

---

## Tech Stack

| Layer | Technology | Why |
|---|---|---|
| Framework | Next.js 16 (App Router) | Full-stack React — API routes + UI in one codebase |
| Database | SQLite via `better-sqlite3` | Zero-config, no server needed, fast, reliable |
| Auth | JWT + bcrypt (httpOnly cookie) | Secure, stateless session management |
| Styling | Tailwind CSS v4 + Custom CSS | Enterprise dark-navy sidebar, light blue/green accents |
| Language | TypeScript | Type safety across the full stack |

**Why SQLite?** At 800 employees with ~30 item categories, SQLite comfortably handles this workload. It runs as a single file (`data/fmcl.db`), requires no database server, and is trivially backed up — just copy the file.

---

## Features

### Module Overview

| Module | Path | Description |
|---|---|---|
| Dashboard | `/dashboard` | KPI cards, low-stock alerts, recent allocations, employees-by-building |
| Employees | `/employees` | Add/edit employees with building, category, and date tracking |
| Inventory | `/inventory` | Stock management with +/- adjustments, low-stock highlighting |
| Allocations | `/allocations` | Issue items to employees; one-click Return or Salary Deduct |
| Procurement | `/procurement` | Purchase requests that trigger the 4-step approval workflow |
| Approvals | `/approvals` | Role-aware inbox — each manager sees only their pending step |
| Deductions | `/deductions` | Prorated salary deduction tracker; Finance can Process or Waive |
| Vendors | `/vendors` | Supplier contact cards |
| Admin | `/admin` | User CRUD with role and building assignment (Admin only) |

### Dashboard KPIs
- Active Employees
- Total Inventory Items
- Low Stock Alerts
- Pending Procurement Approvals
- Active Allocations
- Pending Salary Deductions

---

## Project Structure

```
fmcl-inventory/
├── data/                        # SQLite database (auto-created on first run)
│   └── fmcl.db
├── src/
│   ├── app/
│   │   ├── api/                 # API routes (server-side)
│   │   │   ├── auth/            # POST login, DELETE logout
│   │   │   ├── employees/       # GET list, POST create, PUT/GET by id
│   │   │   ├── inventory/       # GET list, POST create, PUT/DELETE by id
│   │   │   ├── allocations/     # GET list, POST issue, PUT return/deduct
│   │   │   ├── procurement/     # GET list, POST create
│   │   │   ├── approvals/       # GET pending, POST approve/reject
│   │   │   ├── deductions/      # GET list, PUT update status
│   │   │   ├── vendors/         # GET list, POST create
│   │   │   ├── users/           # Admin: GET list, POST create, PUT/DELETE by id
│   │   │   └── dashboard/       # GET aggregated stats
│   │   ├── components/
│   │   │   ├── AppShell.tsx     # Server component: auth guard + layout wrapper
│   │   │   └── Sidebar.tsx      # Client component: navigation sidebar
│   │   ├── dashboard/page.tsx   # Server-rendered dashboard
│   │   ├── employees/           # page.tsx (server) + client.tsx (interactive)
│   │   ├── inventory/
│   │   ├── allocations/
│   │   ├── procurement/
│   │   ├── approvals/
│   │   ├── deductions/
│   │   ├── vendors/
│   │   ├── admin/
│   │   ├── login/page.tsx
│   │   ├── layout.tsx
│   │   ├── page.tsx             # Root redirect to /dashboard or /login
│   │   └── globals.css
│   └── lib/
│       ├── db.ts                # SQLite connection + schema init + seed data
│       ├── auth.ts              # JWT sign/verify, getSession(), APPROVAL_STEPS
│       └── utils.ts             # formatDate, calcDeduction, statusBadge, roleLabel
├── .env.local                   # JWT_SECRET (change before production)
├── next.config.ts
├── package.json
└── README.md
```

---

## Database Schema

```sql
users               -- System accounts with role-based access
buildings           -- 10 buildings in Hyderabad
employee_categories -- Mechanical, Electrical, Plumbing, HVAC, Housekeeping, etc.
employees           -- Staff linked to building + category with join/leave dates
vendors             -- Uniform/equipment suppliers
item_categories     -- Uniform Dress, Footwear, Safety Equipment, Tools, etc.
inventory_items     -- Individual SKUs with size, cost, stock level, vendor
stock_transactions  -- Audit log of every stock in/out/return/adjustment
allocations         -- Which employee has which item (issued/returned/deducted)
deductions          -- Salary deduction records with tenure-based calculation
procurement_requests -- Purchase requests with status tracking
approvals           -- 4-step approval chain per procurement request
```

### Key Relationships

```
Employee        → Building (many-to-one)
Employee        → Category (many-to-one)
Allocation      → Employee + InventoryItem
Deduction       → Employee + Allocation
ProcurementReq  → InventoryItem
Approval        → ProcurementRequest (4 rows per request, one per step)
```

---

## User Roles & Permissions

| Role | Email | Can Do |
|---|---|---|
| `admin` | admin@fmcl.com | Everything + user management |
| `tech_manager` | tech.manager@fmcl.com | Add employees, manage inventory, step-1 approvals |
| `senior_manager` | senior.manager@fmcl.com | Step-2 procurement approvals |
| `finance_manager` | finance.manager@fmcl.com | Step-3 approvals, process/waive deductions |
| `managing_director` | md@fmcl.com | Final step-4 approval (triggers stock update) |
| `staff` | — | Read-only view |

---

## Getting Started (Local)

### Prerequisites
- Node.js 18+
- npm 9+

### Install & Run

```powershell
# Navigate to the project folder
cd "C:\Users\reddy\Desktop\Ramesh\fmcl-inventory"

# Install dependencies (first time only)
npm install

# Start the development server
npm run dev -- -p 3001
```

Open your browser at **http://localhost:3001**

The database is created automatically at `data/fmcl.db` with all seed data on first run.

### Build for Production

```powershell
npm run build
npm start -- -p 3001
```

---

## Exposing Online with ngrok

ngrok creates a secure public HTTPS URL that tunnels to your local machine.
Anyone with the link can access your app while it is running on your PC.

### Step 1 — Install ngrok

**Option A — winget (Windows Package Manager)**
```powershell
winget install ngrok.ngrok
```

**Option B — Direct download (if winget is blocked)**
1. Go to https://ngrok.com/download
2. Download the **Windows 64-bit** ZIP
3. Extract `ngrok.exe` to `C:\Users\reddy\Desktop\Ramesh\`

### Step 2 — Create a Free Account

1. Sign up at https://dashboard.ngrok.com/signup (free, no credit card needed)
2. After login go to **Getting Started → Your Authtoken**
3. Copy your token (looks like: `2aBcXYZ123_xxxxxxxxxxxxxxxx`)

### Step 3 — Authenticate ngrok (run once)

```powershell
ngrok config add-authtoken YOUR_AUTHTOKEN_HERE
```

This saves the token permanently — you only need to do this once.

### Step 4 — Start the App and the Tunnel

Open **two separate PowerShell windows**:

**Window 1 — Start the app:**
```powershell
cd "C:\Users\reddy\Desktop\Ramesh\fmcl-inventory"
npm run dev -- -p 3001
```

**Window 2 — Start the tunnel:**
```powershell
# If ngrok.exe is in C:\Users\reddy\Desktop\Ramesh\
cd "C:\Users\reddy\Desktop\Ramesh"
.\ngrok.exe http 3001

# OR if installed via winget (available globally)
ngrok http 3001
```

You will see output like:

```
Session Status    online
Account           yourname@email.com (Plan: Free)
Forwarding        https://a1b2c3d4e5f6.ngrok-free.app -> http://localhost:3001
Web Interface     http://127.0.0.1:4040
```

**Share the `https://xxxx.ngrok-free.app` link with anyone — it works immediately.**

### ngrok Notes

| Point | Detail |
|---|---|
| URL is temporary | Free plan gives a new URL each restart. Upgrade to paid ($10/mo) for a fixed domain. |
| Both must stay open | The app AND ngrok terminal must remain running |
| Free limits | 1 tunnel, 40 requests/min on free tier — fine for demos |
| HTTPS included | ngrok handles SSL automatically — no certificate setup needed |
| Traffic inspector | Visit http://127.0.0.1:4040 to inspect every request/response |

### Optional: Fixed Subdomain (Paid Plan)

```powershell
ngrok http 3001 --domain=fmcl-inventory.ngrok.app
```

---

## Default Login Credentials

| Role | Email | Password |
|---|---|---|
| System Admin | admin@fmcl.com | Admin@123 |
| Tech Manager | tech.manager@fmcl.com | Pass@123 |
| Senior Manager | senior.manager@fmcl.com | Pass@123 |
| Finance Manager | finance.manager@fmcl.com | Pass@123 |
| Managing Director | md@fmcl.com | Pass@123 |

> **Change all passwords before sharing with real users.**
> Go to Admin panel → click Edit on each user.

---

## Business Rules

### Uniform Entitlement per Employee
- Each employee receives **2 pairs of dress + 1 pair of shoes** per year
- Initially only **1 pair** is issued; the second pair is held back
- **Day 1 is OJT** (On-the-Job Training) — client pays, no recovery
- Cost recovery starts from **Day 2** onwards

### Salary Deduction on Early Exit

| Scenario | Deduction Amount |
|---|---|
| Leaves within 1 week (days 1-7) | **100% of uniform cost** |
| Leaves after 1 week | **Prorated**: `cost × (1 - tenure_days / 365)` |
| Completes full year (365 days) | No deduction — fully earned |

**Example:** Employee leaves after 90 days, dress cost ₹450:
```
Deduction = 450 × (1 - 90/365) = 450 × 0.753 = ₹338.85
```

### Low Stock Alert
Items show a warning badge when `stock_quantity <= low_stock_threshold`.
Default threshold: **20 units** (configurable per item).

### Position-Based Tracking
Tracking is position-based (not person-based) due to high turnover.
When an employee leaves and a new one joins the same position, items are reassigned rather than re-procured where possible.

---

## Approval Workflow

Every procurement request goes through 4 sequential approval steps:

```
Anyone (Staff / Admin)
    │
    ▼  Creates procurement request
┌─────────────────────┐
│   Tech Manager       │  Step 1
│   Approves / Rejects │
└────────┬────────────┘
         │ Approved
         ▼
┌─────────────────────┐
│   Senior Manager     │  Step 2
│   Approves / Rejects │
└────────┬────────────┘
         │ Approved
         ▼
┌─────────────────────┐
│   Finance Manager    │  Step 3
│   Approves / Rejects │
└────────┬────────────┘
         │ Approved
         ▼
┌─────────────────────┐
│   Managing Director  │  Step 4 (Final)
│   Approves / Rejects │
└────────┬────────────┘
         │ Approved
         ▼
  Stock automatically updated ✓
```

- Any rejection at any step terminates the entire workflow
- Each role only sees requests at their own step in the Approvals inbox
- Comments can be added at each step for audit trail
- Final MD approval automatically increments the inventory stock count

---

## Going to Production

### Option A — VPS (Recommended — keeps SQLite, full control)

Best for permanent internal use. Cost: ~₹400-600/month on Hetzner, DigitalOcean, or AWS Lightsail.

```bash
# On Ubuntu 22.04 VPS
git clone your-repo /opt/fmcl-inventory
cd /opt/fmcl-inventory
npm install
npm run build

# Keep running with PM2
npm install -g pm2
pm2 start npm --name "fmcl" -- start -- -p 3001
pm2 save
pm2 startup   # auto-start on server reboot

# Set up nginx to proxy port 80 -> 3001
# Add free SSL with: sudo certbot --nginx
```

Your data lives in `/opt/fmcl-inventory/data/fmcl.db` — back it up with cron.

### Option B — Vercel + Turso (Free cloud, requires DB swap)

SQLite cannot run on Vercel's serverless functions. Swap `better-sqlite3` for
**Turso** (free-tier cloud SQLite, identical SQL syntax):

1. Create account at https://turso.tech
2. Replace `getDb()` in `src/lib/db.ts` with the `@libsql/client` Turso client
3. Push code to GitHub
4. Connect repo to Vercel — auto-deploys on every `git push`

### Pre-Launch Security Checklist

- [ ] Change `JWT_SECRET` in `.env.local` to a long random string (32+ chars)
- [ ] Change all default passwords via the Admin panel
- [ ] Enable HTTPS (ngrok handles this; VPS needs certbot)
- [ ] Set up daily backup of `data/fmcl.db`
- [ ] Remove demo credentials box from `src/app/login/page.tsx`
- [ ] Review user roles — remove any test accounts

---

## Backup

The entire database is one file. Back it up by copying:

```powershell
# Manual backup
$date = Get-Date -Format "yyyy-MM-dd"
Copy-Item "C:\Users\reddy\Desktop\Ramesh\fmcl-inventory\data\fmcl.db" `
          "C:\Users\reddy\Desktop\Ramesh\fmcl-inventory\data\fmcl-backup-$date.db"
```

**Automate with Windows Task Scheduler:**
1. Open Task Scheduler → Create Basic Task
2. Trigger: Daily at 11 PM
3. Action: Start a program → `powershell.exe`
4. Arguments: `-Command "Copy-Item 'C:\...\data\fmcl.db' 'C:\...\data\fmcl-backup-$(Get-Date -Format yyyy-MM-dd).db'"`

---

*Built with Next.js 16 + SQLite · June 2026 · FMCL Hyderabad*
