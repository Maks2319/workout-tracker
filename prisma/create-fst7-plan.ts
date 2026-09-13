import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });

  const user = await prisma.user.findFirstOrThrow();

  // Deactivate the old program — this new cycle replaces it as the active plan.
  await prisma.workoutPlan.updateMany({
    where: { userId: user.id, isActive: true },
    data: { isActive: false },
  });

  const plan = await prisma.workoutPlan.create({
    data: {
      userId: user.id,
      name: "FST-7 — Масса (осень 2026)",
      goalType: "HYPERTROPHY",
      goalText:
        "Набор массы, приоритет грудь (2 дня/неделю), FST-7-финишер на отстающую группу каждый день. Цикл до Нового года.",
      isActive: true,
    },
  });

  const day1 = await prisma.planDay.create({
    data: { planId: plan.id, dayIndex: 1, name: "День 1 — Грудь (тяжёлый) + Трицепс" },
  });

  type SetSpec = { type: "WARMUP" | "WORKING"; reps: string; count: number; restSeconds: number };
  type ExerciseSpec = { slug: string; note?: string; sets: SetSpec[] };

  const exercises: ExerciseSpec[] = [
    {
      slug: "barbell-bench-press---medium-grip",
      sets: [
        { type: "WARMUP", reps: "20", count: 1, restSeconds: 45 },
        { type: "WARMUP", reps: "10", count: 1, restSeconds: 60 },
        { type: "WORKING", reps: "6-8", count: 4, restSeconds: 120 },
      ],
    },
    {
      slug: "smith-machine-incline-bench-press",
      sets: [
        { type: "WARMUP", reps: "12-15", count: 1, restSeconds: 45 },
        { type: "WORKING", reps: "8-10", count: 4, restSeconds: 90 },
      ],
    },
    {
      slug: "custom-lever-incline-chest-press",
      note: "Лёгкий вес, добивка — не силовое упражнение",
      sets: [{ type: "WORKING", reps: "12-15", count: 3, restSeconds: 60 }],
    },
    {
      slug: "incline-cable-flye",
      note: "FST-7: 7 подходов подряд, короткий отдых, полная растяжка внизу",
      sets: [{ type: "WORKING", reps: "10-12", count: 7, restSeconds: 35 }],
    },
    {
      slug: "close-grip-barbell-bench-press",
      sets: [
        { type: "WARMUP", reps: "12-15", count: 1, restSeconds: 45 },
        { type: "WORKING", reps: "8-10", count: 3, restSeconds: 90 },
      ],
    },
    {
      slug: "triceps-pushdown---rope-attachment",
      sets: [{ type: "WORKING", reps: "10-12", count: 3, restSeconds: 60 }],
    },
  ];

  for (let i = 0; i < exercises.length; i++) {
    const spec = exercises[i];
    const exercise = await prisma.exercise.findUniqueOrThrow({ where: { slug: spec.slug } });
    const pde = await prisma.planDayExercise.create({
      data: { planDayId: day1.id, exerciseId: exercise.id, orderIndex: i, note: spec.note },
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

  console.log(`Created plan "${plan.name}" (${plan.id}), day "${day1.name}" (${day1.id})`);
  await prisma.$disconnect();
}

main();
