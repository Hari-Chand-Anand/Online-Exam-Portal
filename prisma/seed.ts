import { PrismaClient, Role } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const adminEmail = (process.env.ADMIN_EMAILS || "admin@company.com").split(",")[0].trim().toLowerCase();

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: { role: Role.ADMIN, name: "Admin User" },
    create: { email: adminEmail, name: "Admin User", role: Role.ADMIN }
  });

  const candidates = await Promise.all([
    prisma.candidate.upsert({
      where: { email: "candidate1@example.com" },
      update: {},
      create: { name: "Aarav Sharma", email: "candidate1@example.com", phone: "9999999991", college: "Delhi Technical College", roleApplied: "AI Intern", status: "ACTIVE" }
    }),
    prisma.candidate.upsert({
      where: { email: "candidate2@example.com" },
      update: {},
      create: { name: "Meera Iyer", email: "candidate2@example.com", phone: "9999999992", college: "Bangalore Institute", roleApplied: "Automation Intern", status: "ACTIVE" }
    }),
    prisma.candidate.upsert({
      where: { email: "candidate3@example.com" },
      update: {},
      create: { name: "Kabir Khan", email: "candidate3@example.com", phone: "9999999993", college: "Mumbai University", roleApplied: "Data Intern", status: "INACTIVE" }
    })
  ]);

  const setting = await prisma.setting.findFirst();
  if (!setting) {
    await prisma.setting.create({
      data: {
        companyName: process.env.NEXT_PUBLIC_COMPANY_NAME || "HCA Automation",
        examRules: "Use your own Gmail account. Do not switch tabs, refresh, copy, paste, right-click, or exit fullscreen. Suspicious activity is logged and may lead to rejection.",
        suspiciousActivityThreshold: 6,
        showResultToCandidateDefault: false
      }
    });
  }

  const q1 = await prisma.question.create({
    data: {
      type: "MCQ",
      category: "Aptitude",
      difficulty: "EASY",
      questionText: "If a machine produces 120 pieces in 3 hours, how many pieces will it produce in 5 hours at the same speed?",
      correctAnswer: "B",
      marks: 2,
      options: { create: [
        { label: "A", value: "180", isCorrect: false, sortOrder: 1 },
        { label: "B", value: "200", isCorrect: true, sortOrder: 2 },
        { label: "C", value: "220", isCorrect: false, sortOrder: 3 },
        { label: "D", value: "240", isCorrect: false, sortOrder: 4 }
      ] }
    }
  });

  const q2 = await prisma.question.create({
    data: {
      type: "TRUE_FALSE",
      category: "Logical Reasoning",
      difficulty: "EASY",
      questionText: "True or False: If all approved candidates are allowed to login, an inactive candidate should also be allowed to attempt the exam.",
      correctAnswer: "B",
      marks: 1,
      options: { create: [
        { label: "A", value: "True", isCorrect: false, sortOrder: 1 },
        { label: "B", value: "False", isCorrect: true, sortOrder: 2 }
      ] }
    }
  });

  const q3 = await prisma.question.create({
    data: {
      type: "MCQ",
      category: "Technical",
      difficulty: "MEDIUM",
      questionText: "Which database is used in this intern exam portal?",
      correctAnswer: "C",
      marks: 2,
      options: { create: [
        { label: "A", value: "MongoDB", isCorrect: false, sortOrder: 1 },
        { label: "B", value: "SQLite only", isCorrect: false, sortOrder: 2 },
        { label: "C", value: "PostgreSQL", isCorrect: true, sortOrder: 3 },
        { label: "D", value: "Firebase only", isCorrect: false, sortOrder: 4 }
      ] }
    }
  });

  const q4 = await prisma.question.create({
    data: {
      type: "SHORT_ANSWER",
      category: "HR",
      difficulty: "MEDIUM",
      questionText: "Explain in 4-5 lines why you are interested in this internship.",
      correctAnswer: "Manual review required",
      marks: 5
    }
  });

  const start = new Date();
  start.setHours(start.getHours() - 1);
  const end = new Date();
  end.setDate(end.getDate() + 30);

  const exam = await prisma.exam.create({
    data: {
      title: "Sample Intern Hiring Test",
      description: "A sample test covering aptitude, reasoning, technical awareness, and HR response.",
      durationMinutes: 30,
      totalMarks: 10,
      passingMarks: 5,
      startTime: start,
      endTime: end,
      maxAttempts: 1,
      negativeMarkingEnabled: false,
      randomQuestionOrderEnabled: true,
      shuffleOptionsEnabled: true,
      assignToAllCandidates: false,
      suspiciousThreshold: 6,
      showResultToCandidate: false,
      status: "PUBLISHED"
    }
  });

  for (const [index, q] of [q1, q2, q3, q4].entries()) {
    await prisma.examQuestion.create({ data: { examId: exam.id, questionId: q.id, sortOrder: index + 1 } });
  }
  for (const candidate of candidates.slice(0, 2)) {
    await prisma.examAssignment.create({ data: { examId: exam.id, candidateId: candidate.id } });
  }

  console.log("Seed completed");
  console.log(`Admin email: ${adminEmail}`);
  console.log("Sample candidate emails: candidate1@example.com, candidate2@example.com");
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(async () => prisma.$disconnect());
