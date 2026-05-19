-- Intern Online Exam Portal PostgreSQL schema
-- You can run this file manually, or use Prisma: npx prisma db push

CREATE TYPE "Role" AS ENUM ('ADMIN', 'CANDIDATE');
CREATE TYPE "CandidateStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'BLOCKED');
CREATE TYPE "ExamStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');
CREATE TYPE "QuestionType" AS ENUM ('MCQ', 'TRUE_FALSE', 'SHORT_ANSWER', 'CODING');
CREATE TYPE "Difficulty" AS ENUM ('EASY', 'MEDIUM', 'HARD');
CREATE TYPE "AttemptStatus" AS ENUM ('IN_PROGRESS', 'SUBMITTED', 'AUTO_SUBMITTED', 'EXPIRED', 'DISQUALIFIED');
CREATE TYPE "ResultStatus" AS ENUM ('PENDING_REVIEW', 'PASSED', 'FAILED', 'DISQUALIFIED');
CREATE TYPE "ProctoringEventType" AS ENUM ('TAB_SWITCH', 'WINDOW_BLUR', 'FULLSCREEN_EXIT', 'COPY', 'PASTE', 'RIGHT_CLICK', 'REFRESH_NAVIGATION', 'INACTIVITY', 'WARNING');

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT,
  email TEXT UNIQUE,
  "emailVerified" TIMESTAMP,
  image TEXT,
  role "Role" NOT NULL DEFAULT 'CANDIDATE',
  "lastLoginAt" TIMESTAMP,
  "lastLoginIp" TEXT,
  "lastUserAgent" TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS accounts (
  id TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  provider TEXT NOT NULL,
  "providerAccountId" TEXT NOT NULL,
  refresh_token TEXT,
  access_token TEXT,
  expires_at INTEGER,
  token_type TEXT,
  scope TEXT,
  id_token TEXT,
  session_state TEXT,
  UNIQUE(provider, "providerAccountId")
);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  "sessionToken" TEXT UNIQUE NOT NULL,
  "userId" TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS verification_tokens (
  identifier TEXT NOT NULL,
  token TEXT UNIQUE NOT NULL,
  expires TIMESTAMP NOT NULL,
  UNIQUE(identifier, token)
);

CREATE TABLE IF NOT EXISTS candidates (
  id TEXT PRIMARY KEY,
  "userId" TEXT UNIQUE REFERENCES users(id),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  college TEXT,
  role_applied TEXT,
  status "CandidateStatus" NOT NULL DEFAULT 'ACTIVE',
  notes TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS exams (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  duration_minutes INTEGER NOT NULL,
  total_marks DOUBLE PRECISION NOT NULL DEFAULT 0,
  passing_marks DOUBLE PRECISION NOT NULL DEFAULT 0,
  start_time TIMESTAMP,
  end_time TIMESTAMP,
  max_attempts INTEGER NOT NULL DEFAULT 1,
  negative_marking_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  negative_marks DOUBLE PRECISION NOT NULL DEFAULT 0,
  random_question_order_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  shuffle_options_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  assign_to_all_candidates BOOLEAN NOT NULL DEFAULT FALSE,
  suspicious_threshold INTEGER NOT NULL DEFAULT 6,
  show_result_to_candidate BOOLEAN NOT NULL DEFAULT FALSE,
  status "ExamStatus" NOT NULL DEFAULT 'DRAFT',
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS questions (
  id TEXT PRIMARY KEY,
  type "QuestionType" NOT NULL,
  category TEXT NOT NULL,
  difficulty "Difficulty" NOT NULL DEFAULT 'EASY',
  question_text TEXT NOT NULL,
  correct_answer TEXT,
  marks DOUBLE PRECISION NOT NULL DEFAULT 1,
  explanation TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS question_options (
  id TEXT PRIMARY KEY,
  question_id TEXT NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  value TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS exam_questions (
  id TEXT PRIMARY KEY,
  exam_id TEXT NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  question_id TEXT NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  UNIQUE(exam_id, question_id)
);

CREATE TABLE IF NOT EXISTS exam_assignments (
  id TEXT PRIMARY KEY,
  exam_id TEXT NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  candidate_id TEXT NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(exam_id, candidate_id)
);

CREATE TABLE IF NOT EXISTS exam_attempts (
  id TEXT PRIMARY KEY,
  exam_id TEXT NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  candidate_id TEXT NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP NOT NULL,
  submit_time TIMESTAMP,
  status "AttemptStatus" NOT NULL DEFAULT 'IN_PROGRESS',
  ip_address TEXT,
  user_agent TEXT,
  question_order JSONB,
  warning_count INTEGER NOT NULL DEFAULT 0,
  suspicious_event_count INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS candidate_answers (
  id TEXT PRIMARY KEY,
  attempt_id TEXT NOT NULL REFERENCES exam_attempts(id) ON DELETE CASCADE,
  question_id TEXT NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  selected_option_id TEXT REFERENCES question_options(id),
  answer_text TEXT,
  is_correct BOOLEAN,
  marks_awarded DOUBLE PRECISION NOT NULL DEFAULT 0,
  marked_for_review BOOLEAN NOT NULL DEFAULT FALSE,
  reviewed_by_admin BOOLEAN NOT NULL DEFAULT FALSE,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(attempt_id, question_id)
);

CREATE TABLE IF NOT EXISTS proctoring_events (
  id TEXT PRIMARY KEY,
  attempt_id TEXT NOT NULL REFERENCES exam_attempts(id) ON DELETE CASCADE,
  event_type "ProctoringEventType" NOT NULL,
  metadata JSONB,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS results (
  id TEXT PRIMARY KEY,
  attempt_id TEXT UNIQUE NOT NULL REFERENCES exam_attempts(id) ON DELETE CASCADE,
  score DOUBLE PRECISION NOT NULL DEFAULT 0,
  percentage DOUBLE PRECISION NOT NULL DEFAULT 0,
  status "ResultStatus" NOT NULL DEFAULT 'PENDING_REVIEW',
  correct_count INTEGER NOT NULL DEFAULT 0,
  wrong_count INTEGER NOT NULL DEFAULT 0,
  unanswered_count INTEGER NOT NULL DEFAULT 0,
  subjective_pending BOOLEAN NOT NULL DEFAULT FALSE,
  rank INTEGER,
  remarks TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS settings (
  id TEXT PRIMARY KEY,
  company_name TEXT NOT NULL DEFAULT 'HCA Automation',
  logo_url TEXT,
  exam_rules TEXT NOT NULL DEFAULT 'Do not switch tabs, refresh, copy, paste, or leave fullscreen during the exam.',
  suspicious_activity_threshold INTEGER NOT NULL DEFAULT 6,
  show_result_to_candidate_default BOOLEAN NOT NULL DEFAULT FALSE,
  email_notifications_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  action TEXT NOT NULL,
  entity TEXT,
  entity_id TEXT,
  metadata JSONB,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS candidates_email_idx ON candidates(email);
CREATE INDEX IF NOT EXISTS questions_category_idx ON questions(category);
CREATE INDEX IF NOT EXISTS questions_difficulty_idx ON questions(difficulty);
CREATE INDEX IF NOT EXISTS exam_attempts_exam_candidate_idx ON exam_attempts(exam_id, candidate_id);
CREATE INDEX IF NOT EXISTS proctoring_events_attempt_event_idx ON proctoring_events(attempt_id, event_type);
CREATE INDEX IF NOT EXISTS audit_logs_action_entity_idx ON audit_logs(action, entity);
