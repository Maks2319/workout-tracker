import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import names0 from "./translations/names-0";
import names1 from "./translations/names-1";
import names2 from "./translations/names-2";
import names3 from "./translations/names-3";
import names4 from "./translations/names-4";
import names5 from "./translations/names-5";

const ALL: Record<string, string> = {
  ...names0,
  ...names1,
  ...names2,
  ...names3,
  ...names4,
  ...names5,
};

async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });

  const exercises = await prisma.exercise.findMany({
    where: { isCustom: false },
    select: { id: true, slug: true, name: true },
  });

  const missing: string[] = [];
  let updated = 0;
  for (const ex of exercises) {
    const ru = ALL[ex.slug];
    if (!ru) {
      missing.push(`${ex.slug} | ${ex.name}`);
      continue;
    }
    await prisma.exercise.update({ where: { id: ex.id }, data: { nameRu: ru } });
    updated++;
  }

  console.log(`Translated ${Object.keys(ALL).length} entries in mapping.`);
  console.log(`Updated ${updated}/${exercises.length} exercises.`);
  if (missing.length > 0) {
    console.log(`Missing translations (${missing.length}):`);
    for (const m of missing) console.log(`  ${m}`);
  }

  await prisma.$disconnect();
}

main();
