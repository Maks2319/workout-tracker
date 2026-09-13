"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/current-user";
import type { SetType } from "@/generated/prisma/client";

export async function startSession(formData: FormData) {
  const planDayId = String(formData.get("planDayId"));
  const user = await getCurrentUser();
  if (!user) throw new Error("No user");

  const session = await prisma.workoutSession.create({
    data: { userId: user.id, planDayId },
  });

  redirect(`/workout/${session.id}`);
}

export type LoggedSetEntry = {
  planDayExerciseId: string;
  planSetId: string;
  setIndex: number;
  type: SetType;
  weightKg: number | null;
  reps: number | null;
};

export async function logSets(sessionId: string, entries: LoggedSetEntry[]) {
  await prisma.setLog.createMany({
    data: entries.map((e) => ({
      sessionId,
      planDayExerciseId: e.planDayExerciseId,
      planSetId: e.planSetId,
      setIndex: e.setIndex,
      type: e.type,
      weightKg: e.weightKg,
      reps: e.reps,
    })),
  });
}

export async function finishSession(
  sessionId: string,
  rating: number | null,
  notes: string | null,
) {
  await prisma.workoutSession.update({
    where: { id: sessionId },
    data: { endedAt: new Date(), rating, notes },
  });
  redirect(`/workout/${sessionId}/summary`);
}
