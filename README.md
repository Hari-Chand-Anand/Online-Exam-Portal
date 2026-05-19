# Intern Online Exam Portal

A production-ready starter application for running secure online intern hiring exams with Google login, role-based dashboards, timed attempts, automatic result calculation, proctoring deterrents, CSV imports/exports, and PostgreSQL storage.

> Browser-level anti-cheating is a deterrent and logging system. It is not 100% foolproof. For high-stakes exams, combine this with live proctoring, identity verification, and post-exam review.

## Features

### Candidate
- Google/Gmail login only
- Email approval check against the candidate list
- Candidate dashboard with assigned exams
- Instruction and consent screen
- Fullscreen exam interface
- Server-side attempt start/end time
- Refresh-safe countdown timer
- Auto-save answers
- Auto-submit on time expiry
- MCQ, true/false, short answer, coding/text answer support
- Result screen with optional score visibility

### Admin
- SaaS-style admin dashboard
- Candidate add, activate/deactivate, CSV import/export
- Exam create/edit/publish/archive
- Question bank with MCQ, true/false, subjective and coding/text questions
- Question CSV import
- Exam assignment to selected candidates or all active candidates
- Results table and detailed answer sheet
- Manual review for subjective/coding answers
- Suspicious activity logs
- CSV exports for results and proctoring reports
- Settings for company, exam rules, threshold and result visibility

### Security and validation
- Role-based protection in server layouts and API handlers
- Auth.js Google OAuth
- Prisma ORM with PostgreSQL
- Zod API validation
- Server-side candidate/exam/attempt access checks
- Max-attempt enforcement
- Server-side timer validation
- Candidate cannot access another candidate's attempt
- Audit log for key admin actions
- Secrets stored in environment variables only

## Tech Stack

- Next.js App Router + TypeScript
- Tailwind CSS
- shadcn-style reusable UI components
- PostgreSQL
- Prisma ORM
- Auth.js / NextAuth Google OAuth
- Zod validation
- PapaParse CSV import
- Resend placeholder for invite emails
- Vercel compatible frontend/backend
- Neon, Supabase, Railway, Render compatible PostgreSQL

## Folder Structure

```txt
intern-online-exam-portal/
├─ prisma/
│  ├─ schema.prisma
│  └─ seed.ts
├─ src/
│  ├─ app/
│  │  ├─ api/
│  │  │  ├─ auth/[...nextauth]/route.ts
│  │  │  ├─ admin/...
│  │  │  └─ candidate/...
│  │  ├─ admin/...
│  │  ├─ candidate/...
│  │  ├─ login/page.tsx
│  │  └─ unauthorized/page.tsx
│  ├─ components/
│  │  ├─ ui/
│  │  ├─ exam-client.tsx
│  │  └─ start-exam-button.tsx
│  ├─ lib/
│  │  ├─ prisma.ts
│  │  ├─ rbac.ts
│  │  ├─ exam-service.ts
│  │  ├─ validators.ts
│  │  └─ email.ts
│  └─ types/next-auth.d.ts
├─ database.sql
├─ sample-candidates.csv
├─ sample-questions.csv
├─ .env.example
├─ docker-compose.yml
└─ README.md
```

## Environment Variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Required:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/intern_exam_portal?schema=public"
AUTH_SECRET="replace-with-openssl-rand-base64-32"
AUTH_URL="http://localhost:3000"
NEXTAUTH_URL="http://localhost:3000"
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
ADMIN_EMAILS="admin@company.com"
NEXT_PUBLIC_APP_NAME="Intern Online Exam Portal"
NEXT_PUBLIC_COMPANY_NAME="HCA Automation"
```

Generate a strong auth secret:

```bash
openssl rand -base64 32
```

## Google OAuth Setup

1. Open Google Cloud Console.
2. Create or select a project.
3. Go to **APIs & Services → Credentials**.
4. Create **OAuth Client ID**.
5. Application type: **Web application**.
6. Add authorized JavaScript origin:

```txt
http://localhost:3000
```

7. Add authorized redirect URI:

```txt
http://localhost:3000/api/auth/callback/google
```

8. Put client ID and secret in `.env.local`.

For production, add:

```txt
https://your-domain.com
https://your-domain.com/api/auth/callback/google
```

## Local Development

### 1. Install dependencies

```bash
npm install
```

### 2. Start PostgreSQL locally

```bash
docker compose up -d postgres
```

### 3. Push Prisma schema

```bash
npx prisma generate
npx prisma db push
```

Alternative: run the raw SQL file manually:

```bash
psql "$DATABASE_URL" -f database.sql
```

### 4. Seed database

```bash
npm run db:seed
```

Seed creates:

- Admin user with email from `ADMIN_EMAILS`
- Sample candidates
- Sample published exam
- Sample questions
- Candidate assignments
- Default settings

### 5. Start app

```bash
npm run dev
```

Open:

```txt
http://localhost:3000
```

## Admin Login

The admin login is Google OAuth based. Use the Gmail account listed in:

```env
ADMIN_EMAILS="your-admin-gmail@gmail.com"
```

After Google login, the app assigns ADMIN role automatically.

## Candidate Login

A candidate can login only if their Gmail/email exists in the `candidates` table with status `ACTIVE`.

Candidate CSV format:

```csv
name,email,phone,college,role_applied
Aarav Sharma,candidate1@example.com,9999999991,Delhi Technical College,AI Intern
```

Question CSV format:

```csv
category,difficulty,type,question,option_a,option_b,option_c,option_d,correct_option,marks
Aptitude,EASY,MCQ,"What is 15% of 200?",20,25,30,40,C,1
```

## Exam Flow

1. Admin creates/publishes an exam.
2. Admin adds questions from question bank.
3. Admin assigns exam to candidates or enables “Assign to all candidates”.
4. Candidate logs in with approved Gmail.
5. Candidate accepts instructions.
6. Server creates/resumes attempt and stores start/end time.
7. Candidate answers questions; answers are auto-saved.
8. Suspicious events are logged.
9. Attempt is submitted manually or automatically when time ends.
10. Objective marks are calculated automatically.
11. Subjective/coding answers stay in Pending Review until admin awards marks.

## Anti-cheating Logs Implemented

- Tab visibility change
- Window blur
- Fullscreen exit
- Copy attempt
- Paste attempt
- Right-click attempt
- Refresh/navigation attempt
- Warning count
- Auto-disqualification after threshold

## API Routes

### Auth

- `GET/POST /api/auth/[...nextauth]`

### Admin

- `GET/POST /api/admin/candidates`
- `POST /api/admin/candidates/import`
- `GET /api/admin/candidates/export`
- `GET/POST /api/admin/exams`
- `GET/PATCH/DELETE /api/admin/exams/[id]`
- `GET/POST /api/admin/questions`
- `POST /api/admin/questions/import`
- `GET /api/admin/results/export`
- `GET /api/admin/proctoring/export`
- `GET /api/admin/stats`

### Candidate

- `POST /api/candidate/attempts/start`
- `POST /api/candidate/attempts/save-answer`
- `POST /api/candidate/attempts/submit`
- `POST /api/candidate/attempts/auto-submit-expired`
- `POST /api/candidate/proctoring`

## Production Deployment on Vercel

1. Push the project to GitHub.
2. Create a Vercel project.
3. Set build command:

```bash
npm run build
```

4. Set environment variables in Vercel:

```env
DATABASE_URL=
AUTH_SECRET=
AUTH_URL=https://your-domain.com
NEXTAUTH_URL=https://your-domain.com
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
ADMIN_EMAILS=
NEXT_PUBLIC_APP_NAME=Intern Online Exam Portal
NEXT_PUBLIC_COMPANY_NAME=HCA Automation
```

5. Add production Google OAuth redirect URL:

```txt
https://your-domain.com/api/auth/callback/google
```

6. Deploy.

7. Run database commands once from your machine or deployment shell:

```bash
npx prisma db push
npm run db:seed
```

## PostgreSQL Hosting Options

### Neon

1. Create Neon project.
2. Copy pooled PostgreSQL connection string.
3. Add it as `DATABASE_URL` in Vercel.
4. Run `npx prisma db push`.

### Supabase

1. Create Supabase project.
2. Go to database connection string.
3. Use session/pooled URL as `DATABASE_URL`.
4. Run `npx prisma db push`.

### Railway

1. Create PostgreSQL service.
2. Copy DATABASE_URL.
3. Add it in Vercel.
4. Run Prisma commands.

### Render

1. Create PostgreSQL database.
2. Copy internal/external connection string.
3. Use external URL for local migration.
4. Use internal URL if deploying app on Render.

## Common Errors and Fixes

### Candidate sees unauthorized

Check:

- Candidate email exists in candidates table
- Candidate status is `ACTIVE`
- Candidate is using the exact same Gmail account

### Google OAuth redirect error

Check:

- Redirect URL is exactly `/api/auth/callback/google`
- `AUTH_URL` / `NEXTAUTH_URL` matches your domain
- Client ID and secret are correct

### Prisma connection error

Check:

- `DATABASE_URL` is correct
- SSL requirement for Neon/Supabase is included if needed
- Database is reachable from Vercel

### Timer resets after refresh

The UI timer may redraw, but the server attempt end time is stored in `exam_attempts.end_time`; the remaining time is recalculated from server time on reload.

### Subjective answers show Pending Review

This is expected. Admin must open the detailed answer sheet and award marks manually.

## Test Checklist

- [ ] Admin can login through Google
- [ ] Uninvited candidate is blocked
- [ ] Active candidate can login
- [ ] Admin can add/import candidates
- [ ] Admin can add/import questions
- [ ] Admin can create and publish exam
- [ ] Admin can assign selected candidates
- [ ] Candidate can view assigned exam
- [ ] Candidate can accept instructions and start exam
- [ ] Timer continues after refresh
- [ ] Answers auto-save
- [ ] Submit creates result
- [ ] MCQ/true-false scoring works
- [ ] Subjective answer stays pending
- [ ] Admin can manually review subjective marks
- [ ] CSV exports work
- [ ] Tab switch/fullscreen/right-click events are logged
- [ ] Threshold auto-disqualifies attempt

## Next Production Improvements

- Add live webcam proctoring integration
- Add OTP verification before exam
- Add candidate photo ID upload
- Add email invite UI with Resend
- Add charts on admin dashboard
- Add role-specific question pools
- Add background cron for expired attempts
- Add rate limiting on API routes
- Add Sentry error monitoring


## Prisma Version Note

This project is pinned to Prisma 6.15.0 because the included `prisma/schema.prisma` uses the Prisma 6 connection style:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

Do not upgrade `prisma` or `@prisma/client` to Prisma 7 unless you also migrate to `prisma.config.ts` and the Prisma 7 driver adapter setup.
