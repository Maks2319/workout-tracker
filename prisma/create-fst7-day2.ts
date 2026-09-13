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

  const day2 = await prisma.planDay.create({
    data: { planId: plan.id, dayIndex: 2, name: "День 2 — Спина + Бицепс" },
  });

  const leverRow = await prisma.exercise.upsert({
    where: { slug: "custom-lever-two-arm-row" },
    create: {
      slug: "custom-lever-two-arm-row",
      name: "Горизонтальная тяга в рычажном тренажёре (двумя руками)",
      category: "COMPOUND",
      equipment: "machine",
      primaryMuscles: ["middle back"],
      secondaryMuscles: ["lats", "biceps"],
      userId: user.id,
      isCustom: true,
    },
    update: {},
  });

  type SetSpec = { type: "WARMUP" | "WORKING"; reps: string; count: number; restSeconds: number };
  type ExerciseSpec = { slug?: string; exerciseId?: string; note?: string; sets: SetSpec[] };

  const exercises: ExerciseSpec[] = [
    {
      slug: "close-grip-front-lat-pulldown",
      sets: [
        { type: "WARMUP", reps: "12-15", count: 1, restSeconds: 45 },
        { type: "WORKING", reps: "8-10", count: 4, restSeconds: 90 },
      ],
    },
    {
      slug: "bent-over-barbell-row",
      sets: [
        { type: "WARMUP", reps: "12-15", count: 1, restSeconds: 45 },
        { type: "WORKING", reps: "8-10", count: 4, restSeconds: 90 },
      ],
    },
    {
      exerciseId: leverRow.id,
      sets: [{ type: "WORKING", reps: "10-12", count: 3, restSeconds: 60 }],
    },
    {
      slug: "bent-over-two-dumbbell-row",
      sets: [{ type: "WORKING", reps: "10-12", count: 3, restSeconds: 60 }],
    },
    {
      slug: "straight-arm-pulldown",
      note: "FST-7: 7 подходов подряд, короткий отдых, полная растяжка широчайших",
      sets: [{ type: "WORKING", reps: "10-12", count: 7, restSeconds: 35 }],
    },
    {
      slug: "cable-rear-delt-fly",
      sets: [{ type: "WORKING", reps: "12-15", count: 3, restSeconds: 60 }],
    },
    {
      slug: "hyperextensions-back-extensions",
      sets: [{ type: "WORKING", reps: "15-20", count: 3, restSeconds: 60 }],
    },
  ];

  for (let i = 0; i < exercises.length; i++) {
    const spec = exercises[i];
    const exerciseId =
      spec.exerciseId ??
      (await prisma.exercise.findUniqueOrThrow({ where: { slug: spec.slug! } })).id;
    const pde = await prisma.planDayExercise.create({
      data: { planDayId: day2.id, exerciseId, orderIndex: i, note: spec.note },
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

  console.log(`Created day "${day2.name}" (${day2.id}) with ${exercises.length} exercises`);
  await prisma.$disconnect();
}

main();
