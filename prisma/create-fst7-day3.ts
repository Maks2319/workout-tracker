import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });

  const user = await prisma.user.findFirstOrThrow();
  const plan = await prisma.workoutPlan.findFirstOrThrow({
    where: { userId: user.id, isActive: true, name: { contains: "FST-7" } },
  });

  const day3 = await prisma.planDay.create({
    data: { planId: plan.id, dayIndex: 3, name: "День 3 — Ноги" },
  });

  type SetSpec = { type: "WARMUP" | "WORKING"; reps: string; count: number; restSeconds: number };
  type ExerciseSpec = { slug: string; note?: string; sets: SetSpec[] };

  const exercises: ExerciseSpec[] = [
    {
      slug: "bodyweight-squat",
      note: "Разминка — активация паттерна и колена перед рабочими весами",
      sets: [{ type: "WARMUP", reps: "15-20", count: 2, restSeconds: 30 }],
    },
    {
      slug: "narrow-stance-leg-press",
      sets: [
        { type: "WARMUP", reps: "20", count: 1, restSeconds: 45 },
        { type: "WORKING", reps: "12-15", count: 6, restSeconds: 90 },
      ],
    },
    {
      slug: "box-squat",
      note: "Высота тумбы — по комфорту колена (мениск), не гнаться за глубиной",
      sets: [
        { type: "WARMUP", reps: "15", count: 1, restSeconds: 45 },
        { type: "WORKING", reps: "10-12", count: 5, restSeconds: 90 },
      ],
    },
    {
      slug: "standing-leg-curl",
      sets: [
        { type: "WARMUP", reps: "15", count: 1, restSeconds: 30 },
        { type: "WORKING", reps: "15", count: 4, restSeconds: 60 },
      ],
    },
    {
      slug: "seated-leg-curl",
      sets: [{ type: "WORKING", reps: "15", count: 4, restSeconds: 60 }],
    },
    {
      slug: "adductor",
      sets: [{ type: "WORKING", reps: "20-30", count: 5, restSeconds: 60 }],
    },
    {
      slug: "leg-extensions",
      note: "FST-7: 7 подходов подряд, короткий отдых",
      sets: [{ type: "WORKING", reps: "10-12", count: 7, restSeconds: 35 }],
    },
    {
      slug: "standing-calf-raises",
      sets: [{ type: "WORKING", reps: "20-30", count: 4, restSeconds: 60 }],
    },
    {
      slug: "farmers-walk",
      note: "Финишер на кондицию/хват, не квадрицепс-движение",
      sets: [{ type: "WORKING", reps: "30-40м", count: 3, restSeconds: 60 }],
    },
  ];

  for (let i = 0; i < exercises.length; i++) {
    const spec = exercises[i];
    const exercise = await prisma.exercise.findUniqueOrThrow({ where: { slug: spec.slug } });
    const pde = await prisma.planDayExercise.create({
      data: { planDayId: day3.id, exerciseId: exercise.id, orderIndex: i, note: spec.note },
    });
    let setIndex = 1;
    for (const s of spec.sets) {
      for (let c = 0; c < s.count; c++) {
        await prisma.planSet.create({
          data: {
            planDayExerciseId: pde.id,
            setIndex: setIndex++,
            type: s.type,
            targetReps: s.reps,
            restSeconds: s.restSeconds,
          },
        });
      }
    }
  }

  console.log(`Created day "${day3.name}" (${day3.id}) with ${exercises.length} exercises`);
  await prisma.$disconnect();
}

main();
