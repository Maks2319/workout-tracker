import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { BackLink } from "@/components/BackLink";
import { CATEGORY_LABELS, displayName } from "@/lib/exercise-labels";
import { GOAL_TYPE_LABELS, SET_TYPE_LABELS, groupSets } from "@/lib/plan-display";

export default async function PlanDetailPage({
  params,
}: PageProps<"/plans/[id]">) {
  const { id } = await params;

  const plan = await prisma.workoutPlan.findUnique({
    where: { id },
    include: {
      days: {
        orderBy: { dayIndex: "asc" },
        include: {
          exercises: {
            orderBy: { orderIndex: "asc" },
            include: { exercise: true, plannedSets: true },
          },
        },
      },
    },
  });

  if (!plan) notFound();

  return (
    <main className="flex flex-1 flex-col px-4 py-6 sm:py-8">
      <div className="mx-auto w-full max-w-md">
        <BackLink fallbackHref="/plans">← К планам</BackLink>

        <h1 className="mt-3 text-2xl font-bold tracking-tight text-zinc-900">
          {plan.name}
        </h1>
        <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[13px] text-zinc-500">
          {plan.goalType && (
            <span className="rounded-full bg-zinc-100 px-2 py-0.5 font-medium text-zinc-600">
              {GOAL_TYPE_LABELS[plan.goalType] ?? plan.goalType}
            </span>
          )}
          <span>{plan.days.length} дней в неделю</span>
        </div>
        {plan.goalText && (
          <p className="mt-2 text-[14px] leading-relaxed text-zinc-500">{plan.goalText}</p>
        )}

        <div className="mt-6 flex flex-col gap-8">
          {plan.days.map((day) => {
            // Group consecutive exercises sharing a supersetGroup so they render as one block.
            const blocks: (typeof day.exercises)[] = [];
            for (const ex of day.exercises) {
              const prevBlock = blocks[blocks.length - 1];
              const prevEx = prevBlock?.[prevBlock.length - 1];
              if (
                ex.supersetGroup !== null &&
                prevEx?.supersetGroup === ex.supersetGroup
              ) {
                prevBlock.push(ex);
              } else {
                blocks.push([ex]);
              }
            }

            return (
              <section key={day.id}>
                <h2 className="text-[13px] font-semibold uppercase tracking-wide text-zinc-400">
                  {day.name}
                </h2>
                <div className="mt-2 flex flex-col gap-2.5">
                  {blocks.map((block) => (
                    <div
                      key={block[0].id}
                      className={
                        block.length > 1
                          ? "rounded-2xl border-2 border-amber-200 bg-amber-50/40 p-1.5"
                          : ""
                      }
                    >
                      {block.length > 1 && (
                        <div className="px-2 pb-1 pt-0.5 text-[11px] font-semibold uppercase tracking-wide text-amber-700">
                          Суперсет — без отдыха между упражнениями
                        </div>
                      )}
                      <div className="flex flex-col gap-2.5">
                        {block.map((pde) => (
                          <ExerciseCard key={pde.id} pde={pde} />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </main>
  );
}

function ExerciseCard({
  pde,
}: {
  pde: {
    id: string;
    note: string | null;
    exercise: { slug: string; name: string; nameRu: string | null; category: string; isCustom: boolean };
    plannedSets: { setIndex: number; type: "WARMUP" | "WORKING" | "DROPSET"; targetReps: string; restSeconds: number }[];
  };
}) {
  const groups = groupSets(pde.plannedSets);

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-3.5">
      <Link
        href={`/exercises/${pde.exercise.slug}`}
        className="text-[15px] font-semibold leading-snug text-zinc-900"
      >
        {displayName(pde.exercise)}
      </Link>
      <div className="mt-1 flex flex-wrap gap-1">
        <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-500">
          {CATEGORY_LABELS[pde.exercise.category]}
        </span>
        {pde.exercise.isCustom && (
          <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-500">
            своё упражнение
          </span>
        )}
      </div>

      <div className="mt-2 flex flex-col gap-1">
        {groups.map((g, i) => (
          <div key={i} className="flex items-baseline gap-1.5 text-[13px]">
            <span className="w-16 shrink-0 text-zinc-400">{SET_TYPE_LABELS[g.type]}</span>
            <span className="font-medium text-zinc-800">
              {g.count} × {g.targetReps}
            </span>
            <span className="text-zinc-400">отдых {g.restSeconds}с</span>
          </div>
        ))}
      </div>

      {pde.note && (
        <p className="mt-2 rounded-lg bg-zinc-50 p-2 text-[13px] leading-relaxed text-zinc-600">
          {pde.note}
        </p>
      )}
    </div>
  );
}
