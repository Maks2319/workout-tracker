import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import instructions from "./translations/instructions";

async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });

  let updated = 0;
  const missing: string[] = [];
  for (const [slug, ru] of Object.entries(instructions)) {
    const exercise = await prisma.exercise.findUnique({ where: { slug } });
    if (!exercise) {
      missing.push(slug);
      continue;
    }
    await prisma.exercise.update({
      where: { id: exercise.id },
      data: { instructionsRu: ru },
    });
    updated++;
  }

  console.log(`Updated ${updated} exercises with translated instructions.`);
  if (missing.length) console.log("Missing slugs:", missing);

  await prisma.$disconnect();
}

main();
