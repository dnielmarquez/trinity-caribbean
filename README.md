# Maintenance Management System

A comprehensive web application for centralized maintenance and damage report management, built with Next.js, TypeScript, TailwindCSS, and Supabase.

## 🎯 Overview

This system replaces scattered WhatsApp communications with a structured ticket workflow:

**Create report → Assign owner → Manage/validate → Close**

### Problems Solved
- ✅ No more lost messages and evidence
- ✅ Single source of truth for issue status
- ✅ Complete history per property/equipment
- ✅ Easy prioritization and time/cost tracking

## 🔑 Features

### By Role

**Admin**
- Full CRUD on tickets, users, properties, and providers **(Note: Providers table removed in v1 - internal users only)**
- Close tickets with approval
- Block/unblock properties and units
- View analytics and reports

**Sub Director**
- View all tickets
- Block/unblock properties  
- View blocked units and duration

**Maintenance (Technician)**
- View assigned tickets
- Update status, add notes, upload evidence
- Record labor and parts costs

**Reporter (Coordinator/Cleaner/Staff)**
- Create tickets quickly (<30 seconds)
- View own tickets
- Add notes and evidence
- Update status (limited)

### Core Functionality
- ✅ **RBAC** - Row Level Security enforced at database level
- ✅ **Audit Logs** - Complete history of changes
- ✅ **Property Blocking** - Mark units unavailable due to maintenance
- ✅ **File Uploads** - Photos, videos, invoices (Supabase Storage)
- ✅ **Categories** - AC, Plumbing, WiFi, Electrical, etc. with icons
- ✅ **Priorities** - Low, Medium, High, Urgent
- ✅ **Statuses** - Reported → Assigned → In Progress → Resolved → Closed
- ✅ **Preventive Maintenance** - Foundation for recurring tasks (scheduler-ready)
- ✅ **SLA Tracking** - Ticket age calculation
- ✅ **Mobile First** - Responsive design for field staff

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- A Supabase account (free tier works)

### 1. Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Click "New Project"
3. Fill in:
   - **Name**: `maintenance-system` (or your choice)
   - **Database Password**: (save this securely)
   - **Region**: Choose closest to your location
4. Wait for project initialization (~2 minutes)

### 2. Get Supabase Credentials

From your Supabase project dashboard:

1. Go to **Settings** → **API**
2. Copy:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon/public API Key** (starts with `eyJ...`)

### 3. Clone and Install

```bash
cd maintenance-app
npm install
```

### 4. Environment Variables

Create `.env.local` in the project root:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_project_url_from_step_2
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_from_step_2
```

### 5. Set Up Database

#### Run Migrations

In Supabase dashboard, go to **SQL Editor** and run these files in order:

1. `supabase/migrations/001_initial_schema.sql` - Creates all tables, enums, triggers
2. `supabase/migrations/002_rls_policies.sql` - Sets up Row Level Security
3. `supabase/seed.sql` - Adds sample properties and units

#### Create Storage Bucket

1. In Supabase dashboard, go to **Storage**
2. Click **New Bucket**
3. Name: `ticket-attachments`
4. **Public bucket**: Yes (for easier demo; use private in production)
5. Click **Create bucket**

### 6. Create Demo Users

In Supabase dashboard, go to **Authentication** → **Users**:

Create these test users:

| Email | Password | Role |
|-------|----------|------|
| admin@maintenance.app | Admin123! | admin |
| subdirector@maintenance.app | SubDir123! | sub_director |
| technician@maintenance.app | Tech123! | maintenance |
| coordinator@maintenance.app | Coord123! | reporter |

#### Add User Profiles

After creating each user in Auth, copy their UUID. Then run this SQL replacing the UUIDs:

```sql
INSERT INTO profiles (id, full_name, role) VALUES
  ('f430bca9-3b4b-4831-beee-788fd9464fbc', 'Admin User', 'admin'),
  ('340f65eb-8f67-484f-bdd1-49eda99b2071', 'Sub Director', 'sub_director'),
  ('7611a53d-07c7-46f1-bb6b-7d21d72e981a', 'John Technician', 'maintenance'),
  ('ecadff55-f2ad-4621-967f-67dd7783c12c', 'Maria Coordinator', 'reporter');
```

> **Tip**: You can find user UUIDs in **Authentication** → **Users** table.

### 7. Run the App

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

Login with any of the demo users above!

## 📁 Project Structure

```
maintenance-app/
├── app/
│   ├── (dashboard)/          # Protected routes
│   │   ├── dashboard/        # Main dashboard
│   │   ├── tickets/          # Ticket CRUD
│   │   ├── properties/       # Property management
│   │   ├── preventive/       # Preventive maintenance
│   │   └── admin/            # Admin panel
│   ├── login/                # Auth pages
│   └── layout.tsx
├── components/
│   ├── ui/                   # Reusable UI primitives
│   ├── tickets/              # Ticket-specific components
│   ├── properties/           # Property components
│   └── sidebar.tsx
├── actions/                  # Server Actions
│   ├── tickets.ts
│   ├── create-ticket.ts
│   └── ...
├── lib/
│   ├── supabase/             # Supabase clients
│   ├── rbac.ts               # Role-based access control
│   ├── categories.ts         # Category/status/priority configs
│   ├── notifications/        # (Placeholder - not implemented)
│   └── utils.ts
├── types/
│   └── database.ts           # TypeScript types from Supabase
├── supabase/
│   ├── migrations/           # Database migrations
│   └── seed.sql              # Sample data
└── package.json
```

## 🔒 Security

- **Row Level Security (RLS)** enforced on all tables
- **Server Actions** for all mutations
- **Zod validation** on all forms
- **JWT-based auth** via Supabase
- **Middleware** protects all dashboard routes

## 🎨 Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: TailwindCSS v3
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth
- **Storage**: Supabase Storage
- **Icons**: Lucide React
- **Forms**: Zod validation
- **Toasts**: Sonner
- **Date Utils**: date-fns

## 📝 Usage

### Creating a Ticket (<30 seconds)

1. Click **New Ticket**
2. Select **Property** and optionally **Unit**
3. Choose **Type** (Corrective or Preventive)
4. Click **Category** icon (AC, Plumbing, etc.)
5. Enter 1-2 line **Description**
6. Select **Priority**
7. Click **Create Ticket**

### Managing Tickets

- **Dashboard** shows all accessible tickets based on role
- Click **View** to see ticket details, timeline, costs
- **Status badges** show current state
- **Age indicators** highlight overdue tickets (>48h)

### Property Blocking (Sub Director / Admin)

1. Go to **Properties**
2. Select a property
3. Click **Block Property**
4. Enter reason
5. System tracks block duration automatically

## ⚠️ Not Implemented (Out of Scope)

- ❌ Real Telegram notifications - **Placeholder only** (`lib/notifications/`)
- ❌ Email notifications
- ❌ n8n webhooks
- ❌ Automated schedulers/cron for preventive tasks
- ❌ External provider management (removed for v1 simplicity)

**Note**: The system is ready for future integration. Search for `TODO` comments in code.

## 🧪 Testing Checklist

- [ ] Admin can create tickets and close them
- [ ] Sub Director can block properties
- [ ] Maintenance can update assigned tickets only
- [ ] Reporter can create and view own tickets
- [ ] File uploads work (photos, invoices)
- [ ] Ticket timeline shows audit history
- [ ] Property health shows correct metrics
- [ ] Mobile responsive (test on phone)

## 🚢 Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Import to Vercel
3. Add environment variables from `.env.local`
4. Deploy!

### Environment Variables for Production

```bash
NEXT_PUBLIC_SUPABASE_URL=your_production_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_anon_key
```

## 📊 Database Schema

See `supabase/migrations/001_initial_schema.sql` for complete schema.

**Key Tables:**
- `profiles` - User roles
- `properties` & `units` - Property hierarchy
- `tickets` - Main ticket entity
- `ticket_comments` - Discussion thread
- `ticket_attachments` - Files (images/videos/invoices)
- `ticket_costs` - Labor + parts tracking
- `ticket_audit_logs` - Change history
- `property_blocks` - Blocked units
- `preventive_tasks` - Recurring maintenance (foundation)

## 🆘 Troubleshooting

**"Not authenticated" errors**
- Check `.env.local` has correct Supabase credentials
- Verify user exists in Supabase Auth
- Ensure user has a profile in `profiles` table

**RLS Policy errors**
- Run `002_rls_policies.sql` in SQL Editor
- Verify user role in `profiles` table

**File upload fails**
- Check `ticket-attachments` bucket exists in Supabase Storage
- Ensure bucket is public (or configure private with signed URLs)

**Can't see tickets**
- RLS filters tickets by role
- Reporters only see their own tickets
- Maintenance only sees assigned tickets
- Admins/Sub Directors see all

## 📧 Support

For issues or questions about this system, check:
1. Supabase logs (Dashboard → Logs)
2. Browser console for client errors
3. Next.js terminal for server errors

## 📜 License

MIT - Use freely for your business!

---

**Built with ❤️ using Next.js + Supabase**
