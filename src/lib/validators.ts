import { z } from "zod";

export const candidateSchema = z.object({
  name: z.string().min(2),
  email: z.string().email().toLowerCase(),
  phone: z.string().optional().nullable(),
  college: z.string().optional().nullable(),
  roleApplied: z.string().optional().nullable(),
  status: z.enum(["ACTIVE", "INACTIVE", "BLOCKED"]).default("ACTIVE")
});

export const examSchema = z.object({
  title: z.string().min(3),
  description: z.string().optional().nullable(),
  durationMinutes: z.coerce.number().int().min(1),
  totalMarks: z.coerce.number().min(1),
  passingMarks: z.coerce.number().min(0),
  startTime: z.string().optional().nullable(),
  endTime: z.string().optional().nullable(),
  maxAttempts: z.coerce.number().int().min(1).default(1),
  negativeMarkingEnabled: z.coerce.boolean().default(false),
  negativeMarks: z.coerce.number().min(0).default(0),
  randomQuestionOrderEnabled: z.coerce.boolean().default(true),
  shuffleOptionsEnabled: z.coerce.boolean().default(true),
  assignToAllCandidates: z.coerce.boolean().default(false),
  suspiciousThreshold: z.coerce.number().int().min(1).default(6),
  showResultToCandidate: z.coerce.boolean().default(false),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).default("DRAFT")
});

export const questionSchema = z.object({
  type: z.enum(["MCQ", "TRUE_FALSE", "SHORT_ANSWER", "CODING"]),
  category: z.string().min(2),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD"]).default("EASY"),
  questionText: z.string().min(5),
  correctAnswer: z.string().optional().nullable(),
  marks: z.coerce.number().min(0.25).default(1),
  options: z.array(z.object({ label: z.string(), value: z.string(), isCorrect: z.boolean().default(false) })).default([])
});

export const saveAnswerSchema = z.object({
  attemptId: z.string().min(1),
  questionId: z.string().min(1),
  selectedOptionId: z.string().optional().nullable(),
  answerText: z.string().optional().nullable(),
  markedForReview: z.boolean().default(false)
});

export const proctoringEventSchema = z.object({
  attemptId: z.string().min(1),
  eventType: z.enum(["TAB_SWITCH", "WINDOW_BLUR", "FULLSCREEN_EXIT", "COPY", "PASTE", "RIGHT_CLICK", "REFRESH_NAVIGATION", "INACTIVITY", "WARNING"]),
  metadata: z.record(z.unknown()).optional()
});
