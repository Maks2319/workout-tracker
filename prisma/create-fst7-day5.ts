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

  const day5 = await prisma.planDay.create({
    data: { planId: plan.id, dayIndex: 5, name: "День 5 — Руки + Пресс" },
  });

  type SetSpec = { type: "WARMUP" | "WORKING"; reps: string; count: number; restSeconds: number };
  type ExerciseSpec = { slug: string; note?: string; supersetGroup?: number; sets: SetSpec[] };

  const exercises: ExerciseSpec[] = [
    {
      slug: "barbell-curl",
      sets: [
        { type: "WARMUP", reps: "15", count: 1, restSeconds: 45 },
        { type: "WORKING", reps: "8-10", count: 4, restSeconds: 90 },
      ],
    },
    {
      slug: "hammer-curls",
      sets: [{ type: "WORKING", reps: "10-12", count: 3, restSeconds: 60 }],
    },
    {
      slug: "one-arm-dumbbell-preacher-curl",
      sets: [{ type: "WORKING", reps: "10-12", count: 3, restSeconds: 60 }],
    },
    {
      slug: "cable-rope-overhead-triceps-extension",
      sets: [
        { type: "WARMUP", reps: "15", count: 1, restSeconds: 45 },
        { type: "WORKING", reps: "8-10", count: 4, restSeconds: 90 },
      ],
    },
    {
      slug: "dips---triceps-version",
      sets: [{ type: "WORKING", reps: "max", count: 3, restSeconds: 90 }],
    },
    {
      slug: "triceps-pushdown---v-bar-attachment",
      note: "Суперсет + FST-7: сразу переходить на сгибание бицепса в блоке, без отдыха. Отдых 30-45с только после пары.",
      supersetGroup: 1,
      sets: [{ type: "WORKING", reps: "10-12", count: 7, restSeconds: 35 }],
    },
    {
      slug: "standing-biceps-cable-curl",
      note: "Суперсет + FST-7: сразу после разгибания на трицепс, без отдыха. Отдых 30-45с только после пары.",
      supersetGroup: 1,
      sets: [{ type: "WORKING", reps: "10-12", count: 7, restSeconds: 35 }],
    },
    {
      slug: "crunches",
      sets: [{ type: "WORKING", reps: "15-20", count: 3, restSeconds: 45 }],
    },
    {
      slug: "plank",
      sets: [{ type: "WORKING", reps: "45-60 сек", count: 3, restSeconds: 45 }],
    },
  ];

  for (let i = 0; i < exercises.length; i++) {
    const spec = exercises[i];
    const exercise = await prisma.exercise.findUniqueOrThrow({ where: { slug: spec.slug } });
    const pde = await prisma.planDayExercise.create({
      data: {
        planDayId: day5.id,
        exerciseId: exercise.id,
        orderIndex: i,
        note: spec.note,
        supersetGroup: spec.supersetGroup,
      },
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

  console.log(`Created day "${day5.name}" (${day5.id}) with ${exercises.length} exercises`);
  await prisma.$disconnect();
}

main();
