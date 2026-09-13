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

  const day4 = await prisma.planDay.create({
    data: { planId: plan.id, dayIndex: 4, name: "День 4 — Плечи (акцент) + Грудь" },
  });

  type SetSpec = { type: "WARMUP" | "WORKING"; reps: string; count: number; restSeconds: number };
  type ExerciseSpec = { slug: string; note?: string; sets: SetSpec[] };

  const exercises: ExerciseSpec[] = [
    {
      slug: "standing-military-press",
      sets: [
        { type: "WARMUP", reps: "15", count: 1, restSeconds: 45 },
        { type: "WORKING", reps: "8-10", count: 4, restSeconds: 90 },
      ],
    },
    {
      slug: "machine-shoulder-military-press",
      sets: [{ type: "WORKING", reps: "10-12", count: 4, restSeconds: 90 }],
    },
    {
      slug: "side-lateral-raise",
      sets: [{ type: "WORKING", reps: "12-15", count: 4, restSeconds: 60 }],
    },
    {
      slug: "custom-cable-rear-lateral-single-arm",
      sets: [{ type: "WORKING", reps: "12-15", count: 3, restSeconds: 60 }],
    },
    {
      slug: "cable-seated-lateral-raise",
      note: "FST-7: 7 подходов подряд, короткий отдых",
      sets: [{ type: "WORKING", reps: "10-12", count: 7, restSeconds: 35 }],
    },
    {
      slug: "dumbbell-bench-press",
      note: "Грудь — второстепенный акцент в этот день",
      sets: [
        { type: "WARMUP", reps: "15", count: 1, restSeconds: 45 },
        { type: "WORKING", reps: "10-12", count: 3, restSeconds: 90 },
      ],
    },
    {
      slug: "cable-crossover",
      sets: [{ type: "WORKING", reps: "12-15", count: 3, restSeconds: 60 }],
    },
  ];

  for (let i = 0; i < exercises.length; i++) {
    const spec = exercises[i];
    const exercise = await prisma.exercise.findUniqueOrThrow({ where: { slug: spec.slug } });
    const pde = await prisma.planDayExercise.create({
      data: { planDayId: day4.id, exerciseId: exercise.id, orderIndex: i, note: spec.note },
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

  console.log(`Created day "${day4.name}" (${day4.id}) with ${exercises.length} exercises`);
  await prisma.$disconnect();
}

main();
