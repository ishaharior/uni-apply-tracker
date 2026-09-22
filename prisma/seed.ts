import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { importDataset, loadDatasetFromDisk } from '../src/lib/import-data';

async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });

  try {
    const dataset = loadDatasetFromDisk();
    console.log(
      `Importing dataset: ${dataset.universities.length} universities, ` +
        `${Object.keys(dataset.friends).length} users, ` +
        `${dataset.activityLogs.length} activity logs...`
    );
    await importDataset(prisma, dataset);

    const [users, unis, depts, profs, outreach, logs] = await Promise.all([
      prisma.user.count(),
      prisma.university.count(),
      prisma.department.count(),
      prisma.professor.count(),
      prisma.outreachRecord.count(),
      prisma.activityLog.count(),
    ]);
    console.log('Seed complete:');
    console.log(`  users=${users} universities=${unis} departments=${depts}`);
    console.log(`  professors=${profs} outreach=${outreach} activityLogs=${logs}`);
    console.log('Logins: shawon / imran / mahmud — password: A123456');
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
