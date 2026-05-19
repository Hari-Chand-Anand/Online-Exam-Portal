import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const email = "hcaitdep@gmail.com";

  await prisma.user.upsert({
    where: { email },
    update: {
      role: "ADMIN",
      name: "HCA Admin",
    },
    create: {
      email,
      name: "HCA Admin",
      role: "ADMIN",
    },
  });

  console.log(`${email} is now ADMIN`);
}

main()
  .catch(console.error)
  .finally(async () => prisma.$disconnect());
