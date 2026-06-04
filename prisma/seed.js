import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const superAdminEmail = 'vishalsinha15456@gmail.com';
  
  const existingAdmin = await prisma.user.findUnique({
    where: { email: superAdminEmail },
  });

  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash('superadmin123', 10);
    const admin = await prisma.user.create({
      data: {
        name: 'Vishal Sinha',
        email: superAdminEmail,
        password_hash: passwordHash,
        role: 'ADMIN',
      },
    });
    console.log(`Created Super Admin user: ${admin.email}`);
  } else {
    console.log('Super Admin already exists.');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
