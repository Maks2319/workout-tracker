import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { writeFileSync } from "node:fs";

async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });
  const exercises = await prisma.exercise.findMany({
    where: { isCustom: false },
    orderBy: { name: "asc" },
    select: { slug: true, name: true },
  });
  writeFileSync(
    "/tmp/claude-1000/-home-kaneman/cb6f0b27-c98b-4517-9623-120ef540ee11/scratchpad/exercise-names.json",
    JSON.stringify(exercises, null, 0),
  );
  console.log(exercises.length);
  await prisma.$disconnect();
}
main();
