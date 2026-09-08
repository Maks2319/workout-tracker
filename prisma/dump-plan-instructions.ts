import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });

  const planExercises = await prisma.planDayExercise.findMany({
    include: { exercise: true },
  });

  const seen = new Set<string>();
  for (const pde of planExercises) {
    if (pde.exercise.isCustom) continue;
    if (seen.has(pde.exercise.slug)) continue;
    seen.add(pde.exercise.slug);
    console.log(`\n=== ${pde.exercise.slug} | ${pde.exercise.nameRu} ===`);
    pde.exercise.instructions.forEach((s, i) => console.log(`${i + 1}. ${s}`));
  }
  console.log(`\nTotal distinct library exercises: ${seen.size}`);

  await prisma.$disconnect();
}

main();
