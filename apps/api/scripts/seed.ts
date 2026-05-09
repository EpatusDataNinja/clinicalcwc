import { PrismaClient } from '@prisma/client';
import bcryptjs from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = 'tengbeh.s@amdoglass.edu.gh';
  const password = 'CWC@intern2026';
  const hashedPassword = await bcryptjs.hash(password, 10);

  console.log(`Seeding default user: ${email}...`);

  await prisma.user.upsert({
    where: { email },
    update: {
      password: hashedPassword,
      name: 'Tengbeh S.',
    },
    create: {
      email,
      password: hashedPassword,
      name: 'Tengbeh S.',
    },
  });

  console.log('Seed completed successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
