import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const candidateEmail = "tech.auto.191@gmail.com";
  const examTitle = "Ai Intern Analysis";

  const candidate = await prisma.candidate.findUnique({
    where: { email: candidateEmail.toLowerCase() },
  });

  const exam = await prisma.exam.findFirst({
    where: { title: examTitle },
  });

  if (!candidate || !exam) {
    console.log("Candidate or exam not found");
    return;
  }

  const attempts = await prisma.examAttempt.findMany({
    where: {
      candidateId: candidate.id,
      examId: exam.id,
    },
    select: { id: true },
  });

  const attemptIds = attempts.map((a) => a.id);

  if (attemptIds.length === 0) {
    console.log("No attempts found");
    return;
  }

  await prisma.$transaction(async (tx) => {
    await tx.result.deleteMany({
      where: { attemptId: { in: attemptIds } },
    });

    await tx.candidateAnswer.deleteMany({
      where: { attemptId: { in: attemptIds } },
    });

    await tx.proctoringEvent.deleteMany({
      where: { attemptId: { in: attemptIds } },
    });

    await tx.examAttempt.deleteMany({
      where: { id: { in: attemptIds } },
    });
  });

  console.log(`Deleted ${attemptIds.length} failed attempt(s) for ${candidateEmail}`);
}

main()
  .catch(console.error)
  .finally(async () => prisma.$disconnect());
