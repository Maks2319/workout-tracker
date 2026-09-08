import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const EXERCISES_URL =
  "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/dist/exercises.json";
const IMAGE_BASE_URL =
  "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/";

const BASIC_EQUIPMENT = new Set(["barbell", "body only"]);
const BASIC_CATEGORY = new Set([
  "powerlifting",
  "strength",
  "olympic weightlifting",
]);

type RawExercise = {
  id: string;
  name: string;
  force: string | null;
  level: string | null;
  mechanic: "compound" | "isolation" | null;
  equipment: string | null;
  primaryMuscles: string[];
  secondaryMuscles: string[];
  instructions: string[];
  category: string;
  images: string[];
};

function toCategory(ex: RawExercise): "BASIC" | "COMPOUND" | "ISOLATION" {
  if (ex.mechanic === "isolation") return "ISOLATION";
  if (
    ex.mechanic === "compound" &&
    ex.equipment &&
    BASIC_EQUIPMENT.has(ex.equipment) &&
    BASIC_CATEGORY.has(ex.category)
  ) {
    return "BASIC";
  }
  return "COMPOUND";
}

function toSlug(id: string): string {
  return id
    .toLowerCase()
    .replace(/_/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

async function main() {
  console.log(`Fetching exercise data from ${EXERCISES_URL} ...`);
  const res = await fetch(EXERCISES_URL);
  if (!res.ok) {
    throw new Error(`Failed to fetch exercises: ${res.status}`);
  }
  const raw: RawExercise[] = await res.json();
  console.log(`Fetched ${raw.length} exercises. Seeding database...`);

  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });

  let count = 0;
  for (const ex of raw) {
    const slug = toSlug(ex.id);
    await prisma.exercise.upsert({
      where: { slug },
      create: {
        slug,
        name: ex.name,
        category: toCategory(ex),
        mechanic: ex.mechanic,
        force: ex.force,
        level: ex.level,
        equipment: ex.equipment,
        primaryMuscles: ex.primaryMuscles ?? [],
        secondaryMuscles: ex.secondaryMuscles ?? [],
        instructions: ex.instructions ?? [],
        images: (ex.images ?? []).map((path) => `${IMAGE_BASE_URL}${path}`),
      },
      update: {
        name: ex.name,
        category: toCategory(ex),
        mechanic: ex.mechanic,
        force: ex.force,
        level: ex.level,
        equipment: ex.equipment,
        primaryMuscles: ex.primaryMuscles ?? [],
        secondaryMuscles: ex.secondaryMuscles ?? [],
        instructions: ex.instructions ?? [],
        images: (ex.images ?? []).map((path) => `${IMAGE_BASE_URL}${path}`),
      },
    });
    count++;
  }

  console.log(`Seeded ${count} exercises.`);
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
