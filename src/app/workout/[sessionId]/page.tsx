import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { buildWorkoutSteps } from "@/lib/workout-steps";
import { WorkoutRunner } from "@/components/WorkoutRunner";

export default async function WorkoutSessionPage({
  params,
}: PageProps<"/workout/[sessionId]">) {
  const { sessionId } = await params;

  const session = await prisma.workoutSession.findUnique({
    where: { id: sessionId },
    include: {
      planDay: {
        include: {
          exercises: {
            orderBy: { orderIndex: "asc" },
            include: { exercise: true, plannedSets: true },
          },
        },
      },
      setLogs: true,
    },
  });

  if (!session) notFound();
  if (session.endedAt) redirect(`/workout/${sessionId}/summary`);

  const steps = buildWorkoutSteps(session.planDay.exercises);
  const loggedPlanSetIds = new Set(session.setLogs.map((l) => l.planSetId));

  const startIndex = steps.findIndex((step) =>
    step.entries.some((e) => !loggedPlanSetIds.has(e.planSetId)),
  );

  return (
    <WorkoutRunner
      sessionId={session.id}
      dayName={session.planDay.name}
      steps={steps}
      startIndex={startIndex === -1 ? steps.length : startIndex}
    />
  );
}
