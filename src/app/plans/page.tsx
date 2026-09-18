import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/current-user";
import { GOAL_TYPE_LABELS } from "@/lib/plan-display";

export const dynamic = "force-dynamic";

export default async function PlansPage() {
  const user = await getCurrentUser();

  const plans = user
    ? await prisma.workoutPlan.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        include: { days: { select: { id: true } } },
      })
    : [];

  return (
    <main className="flex flex-1 flex-col px-4 py-6 sm:py-8">
      <div className="mx-auto w-full max-w-md">
        <Link
          href="/"
          className="text-sm font-medium text-zinc-500 hover:text-zinc-700"
        >
          ← Назад
        </Link>
        <h1 className="mt-3 text-2xl font-bold tracking-tight text-zinc-900">
          Мой план тренировок
        </h1>

        {plans.length === 0 && (
          <p className="mt-4 text-[15px] leading-relaxed text-zinc-500">
            Пока нет ни одного плана.
          </p>
        )}

        <div className="mt-5 flex flex-col gap-3">
          {plans.map((p) => (
            <Link
              key={p.id}
              href={`/plans/${p.id}`}
              className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm transition-shadow active:shadow-none"
            >
              <div className="flex items-center gap-2">
                <div className="text-[16px] font-semibold text-zinc-900">
                  {p.name}
                </div>
                {p.isActive && (
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                    активный
                  </span>
                )}
              </div>
              <div className="mt-1 text-[14px] text-zinc-500">
                {p.days.length} дней
                {p.goalType && ` · ${GOAL_TYPE_LABELS[p.goalType] ?? p.goalType}`}
              </div>
              {p.goalText && (
                <div className="mt-1.5 text-[13px] leading-snug text-zinc-400">
                  {p.goalText}
                </div>
              )}
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
