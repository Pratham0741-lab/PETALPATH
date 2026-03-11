# PetalPath — Deployment Guide 🌸

## Prerequisites
- Node.js 18+
- npm
- Supabase account ([supabase.com](https://supabase.com))
- Vercel account ([vercel.com](https://vercel.com)) for production deployment

## Step 1: Supabase Setup

1. **Create Project** → Go to [supabase.com](https://supabase.com), sign up, click "New Project"
2. **Name**: `petalpath` | **Password**: set a strong DB password | **Region**: closest to your users
3. **Get API Keys** → Settings → API:
   - Copy **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - Copy **anon/public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Copy **service_role key** → `SUPABASE_SERVICE_ROLE_KEY`
4. **Run Schema** → SQL Editor → paste `supabase/schema.sql` → **Run**
5. **Create Storage Bucket** → Storage → Create bucket `videos` → set to **Public**
6. **Enable Email Auth** → Authentication → Providers → ensure **Email** is enabled
7. **Set Redirect URLs** → Authentication → URL Configuration → add:
   - `http://localhost:3000`
   - Your production domain

## Step 2: Local Development

```bash
# Install dependencies
npm install

# Create environment file
cp .env.local.example .env.local
# Edit .env.local with your Supabase credentials

# Start development server
npm run dev
```

Visit `http://localhost:3000`

## Step 3: Create Admin User

1. Go to Supabase → Authentication → Users → **Add User**
2. Enter admin email and password
3. Go to SQL Editor and run:
```sql
UPDATE profiles SET role = 'admin' WHERE email = 'admin@yourdomain.com';
```

## Step 4: Deploy to Vercel

1. Push code to GitHub
2. Go to [vercel.com](https://vercel.com) → Import project
3. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
4. Deploy!

## Project Structure

```
src/
├── app/
│   ├── admin/          # Admin panel (dashboard, upload, content)
│   ├── api/            # API routes (sessions, progress, recommendations, upload)
│   ├── child/          # Child interface (dashboard, session, discover)
│   ├── dashboard/      # Parent dashboard (home, progress, children)
│   ├── login/          # Auth pages (selector, child, parent, admin)
│   ├── signup/         # Parent sign-up
│   ├── globals.css     # Design system
│   ├── layout.tsx      # Root layout
│   └── page.tsx        # Landing page
├── components/
│   └── child/          # Child UI components
├── contexts/
│   └── AuthContext.tsx  # Authentication provider
├── lib/
│   ├── adaptive-engine.ts  # Adaptive learning algorithm
│   ├── session-builder.ts  # Session construction
│   ├── supabase.ts         # Browser client
│   ├── supabase-server.ts  # Server client
│   └── types.ts            # TypeScript types
└── middleware.ts       # Route protection
```

## User Flows

| Role | Login | Main Page |
|------|-------|-----------|
| Parent | Email + Password | `/dashboard` |
| Child | Parent auth → Avatar → PIN | `/child` |
| Admin | Email + Password | `/admin` |
