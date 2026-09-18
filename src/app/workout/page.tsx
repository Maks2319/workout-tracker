import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/current-user";
import { startSession } from "./actions";

export const dynamic = "force-dynamic";

export default async function WorkoutPage() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <main className="flex flex-1 flex-col px-4 py-6">
        <p className="text-sm text-zinc-500">Нет профиля.</p>
      </main>
    );
  }

  const unfinished = await prisma.workoutSession.findMany({
    where: { userId: user.id, endedAt: null },
    include: { planDay: true },
    orderBy: { startedAt: "desc" },
  });

  const activePlan = await prisma.workoutPlan.findFirst({
    where: { userId: user.id, isActive: true },
    include: {
      days: {
        orderBy: { dayIndex: "asc" },
        include: { exercises: { select: { id: true } } },
      },
    },
  });

  return (
    <main className="flex flex-1 flex-col px-4 py-6 sm:py-8">
      <div className="mx-auto w-full max-w-md">
        <Link href="/" className="text-sm font-medium text-zinc-500 hover:text-zinc-700">
          ← Назад
        </Link>
        <h1 className="mt-3 text-2xl font-bold tracking-tight text-zinc-900">Тренировка</h1>

        {unfinished.length > 0 && (
          <div className="mt-5 flex flex-col gap-2">
            <div className="text-[13px] font-semibold uppercase tracking-wide text-zinc-400">
              Незавершённые
            </div>
            {unfinished.map((s) => (
              <Link
                key={s.id}
                href={`/workout/${s.id}`}
                className="rounded-2xl border-2 border-amber-300 bg-amber-50 p-4"
              >
                <div className="font-semibold text-zinc-900">{s.planDay.name}</div>
                <div className="mt-0.5 text-[13px] text-zinc-500">
                  начата {s.startedAt.toLocaleString("ru-RU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                  {" — продолжить"}
                </div>
              </Link>
            ))}
          </div>
        )}

        {!activePlan && (
          <p className="mt-6 text-sm text-zinc-500">
            Нет активного плана.{" "}
            <Link href="/plans" className="underline">
              Создайте план
            </Link>
            , чтобы начать тренировку.
          </p>
        )}

        {activePlan && (
          <div className="mt-5 flex flex-col gap-2">
            <div className="text-[13px] font-semibold uppercase tracking-wide text-zinc-400">
              {activePlan.name}
            </div>
            {activePlan.days.map((day) => (
              <form key={day.id} action={startSession}>
                <input type="hidden" name="planDayId" value={day.id} />
                <button
                  type="submit"
                  className="w-full rounded-2xl border border-zinc-200 bg-white p-4 text-left shadow-sm active:bg-zinc-50"
                >
                  <div className="font-semibold text-zinc-900">{day.name}</div>
                  <div className="mt-0.5 text-[13px] text-zinc-500">
                    {day.exercises.length} упражнений — начать тренировку
                  </div>
                </button>
              </form>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
