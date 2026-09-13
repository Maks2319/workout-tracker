import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { SET_TYPE_LABELS } from "@/lib/plan-display";

export default async function WorkoutSummaryPage({
  params,
}: PageProps<"/workout/[sessionId]/summary">) {
  const { sessionId } = await params;

  const session = await prisma.workoutSession.findUnique({
    where: { id: sessionId },
    include: {
      planDay: true,
      setLogs: {
        orderBy: { completedAt: "asc" },
        include: { planDayExercise: { include: { exercise: true } } },
      },
    },
  });

  if (!session) notFound();

  const byExercise = new Map<string, { name: string; slug: string; sets: typeof session.setLogs }>();
  for (const log of session.setLogs) {
    const ex = log.planDayExercise.exercise;
    const key = log.planDayExerciseId;
    if (!byExercise.has(key)) {
      byExercise.set(key, { name: ex.nameRu ?? ex.name, slug: ex.slug, sets: [] });
    }
    byExercise.get(key)!.sets.push(log);
  }

  const durationMin =
    session.endedAt && session.startedAt
      ? Math.round((session.endedAt.getTime() - session.startedAt.getTime()) / 60000)
      : null;

  return (
    <main className="flex flex-1 flex-col px-4 py-6 sm:py-8">
      <div className="mx-auto w-full max-w-md">
        <Link href="/workout" className="text-sm font-medium text-zinc-500 hover:text-zinc-700">
          ← К тренировкам
        </Link>

        <h1 className="mt-3 text-2xl font-bold tracking-tight text-zinc-900">
          {session.planDay.name}
        </h1>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-[13px] text-zinc-500">
          <span>
            {session.startedAt.toLocaleDateString("ru-RU", { day: "numeric", month: "long" })}
          </span>
          {durationMin !== null && <span>· {durationMin} мин</span>}
          {session.rating && <span>· оценка {session.rating}/5</span>}
        </div>

        {session.notes && (
          <p className="mt-3 rounded-xl bg-zinc-50 p-3 text-[14px] leading-relaxed text-zinc-600">
            {session.notes}
          </p>
        )}

        <div className="mt-6 flex flex-col gap-3">
          {[...byExercise.entries()].map(([id, data]) => (
            <div key={id} className="rounded-2xl border border-zinc-200 bg-white p-3.5">
              <Link href={`/exercises/${data.slug}`} className="font-semibold text-zinc-900">
                {data.name}
              </Link>
              <div className="mt-2 flex flex-col gap-1">
                {data.sets.map((s) => (
                  <div key={s.id} className="flex items-baseline gap-2 text-[13px]">
                    <span className="w-24 shrink-0 text-zinc-400">{SET_TYPE_LABELS[s.type]}</span>
                    <span className="font-medium text-zinc-800">
                      {s.weightKg != null ? `${s.weightKg} кг` : "—"} × {s.reps ?? "—"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {byExercise.size === 0 && (
          <p className="mt-8 text-center text-sm text-zinc-400">Подходы не были записаны</p>
        )}
      </div>
    </main>
  );
}
