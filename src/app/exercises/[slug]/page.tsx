import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { MuscleDiagram } from "@/components/MuscleDiagram";
import { BackLink } from "@/components/BackLink";
import { CATEGORY_LABELS, MUSCLE_LABELS, displayName, displayInstructions } from "@/lib/exercise-labels";

function muscleLabel(m: string) {
  return MUSCLE_LABELS[m] ?? m;
}

export default async function ExerciseDetailPage({
  params,
}: PageProps<"/exercises/[slug]">) {
  const { slug } = await params;

  const exercise = await prisma.exercise.findUnique({ where: { slug } });
  if (!exercise) notFound();

  return (
    <main className="flex flex-1 flex-col px-4 py-6 sm:py-8">
      <div className="mx-auto w-full max-w-md">
        <BackLink fallbackHref="/exercises">← К списку</BackLink>

        <h1 className="mt-3 text-2xl font-bold leading-tight tracking-tight text-zinc-900">
          {displayName(exercise)}
        </h1>
        <div className="mt-2 flex flex-wrap gap-1.5">
          <span className="rounded-full bg-zinc-900 px-2.5 py-1 text-[12px] font-medium text-white">
            {CATEGORY_LABELS[exercise.category]}
          </span>
          {exercise.equipment && (
            <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-[12px] font-medium text-zinc-600">
              {exercise.equipment}
            </span>
          )}
          {exercise.level && (
            <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-[12px] font-medium text-zinc-600">
              {exercise.level}
            </span>
          )}
        </div>

        {exercise.images.length > 0 && (
          <div className="mt-5 flex gap-2 overflow-x-auto">
            {exercise.images.map((src) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={src}
                src={src}
                alt={displayName(exercise)}
                className="h-52 shrink-0 rounded-2xl border border-zinc-200 object-cover"
              />
            ))}
          </div>
        )}

        <section className="mt-6">
          <h2 className="text-[13px] font-semibold uppercase tracking-wide text-zinc-400">
            Задействованные группы мышц
          </h2>
          <div className="mt-2 rounded-2xl border border-zinc-200 bg-white p-4">
            <MuscleDiagram
              primaryMuscles={exercise.primaryMuscles}
              secondaryMuscles={exercise.secondaryMuscles}
            />
            <div className="mt-3 flex flex-col gap-1.5 border-t border-zinc-100 pt-3 text-[13px]">
              <span className="flex items-start gap-2 text-zinc-700">
                <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-[#1d4ed8]" />
                <span>
                  <span className="font-medium">Основные: </span>
                  {exercise.primaryMuscles.map(muscleLabel).join(", ") || "—"}
                </span>
              </span>
              <span className="flex items-start gap-2 text-zinc-700">
                <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-[#93c5fd]" />
                <span>
                  <span className="font-medium">Дополнительные: </span>
                  {exercise.secondaryMuscles.map(muscleLabel).join(", ") || "—"}
                </span>
              </span>
            </div>
          </div>
        </section>

        {exercise.instructions.length > 0 && (
          <section className="mt-6">
            <div className="flex items-center justify-between">
              <h2 className="text-[13px] font-semibold uppercase tracking-wide text-zinc-400">
                Как выполнять
              </h2>
              {exercise.instructionsRu.length === 0 && (
                <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-400">
                  пока на английском
                </span>
              )}
            </div>
            <ol className="mt-2 flex flex-col gap-3">
              {displayInstructions(exercise).map((step, i) => (
                <li key={i} className="flex gap-3">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-[11px] font-semibold text-zinc-500">
                    {i + 1}
                  </span>
                  <span className="text-[15px] leading-relaxed text-zinc-700">
                    {step}
                  </span>
                </li>
              ))}
            </ol>
          </section>
        )}

        {exercise.tips && (
          <section className="mt-6">
            <h2 className="text-[13px] font-semibold uppercase tracking-wide text-zinc-400">
              Нюансы
            </h2>
            <p className="mt-2 rounded-2xl bg-amber-50 p-3.5 text-[15px] leading-relaxed text-amber-900">
              {exercise.tips}
            </p>
          </section>
        )}
      </div>
    </main>
  );
}
