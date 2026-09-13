import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { buildWorkoutSteps, groupStepsIntoSegments, findResumePosition } from "@/lib/workout-steps";
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
  const segments = groupStepsIntoSegments(steps);
  const loggedSetLogs = session.setLogs.filter((l) => l.planSetId !== null);
  const loggedPlanSetIds = new Set(loggedSetLogs.map((l) => l.planSetId!));
  const { segmentIndex, rowIndex } = findResumePosition(segments, loggedPlanSetIds);

  const existingLogs: Record<string, { weightKg: number | null; reps: number | null }> = {};
  for (const log of loggedSetLogs) {
    existingLogs[log.planSetId!] = { weightKg: log.weightKg, reps: log.reps };
  }

  return (
    <WorkoutRunner
      sessionId={session.id}
      dayName={session.planDay.name}
      segments={segments}
      existingLogs={existingLogs}
      startSegmentIndex={segmentIndex}
      startRowIndex={rowIndex}
    />
  );
}
