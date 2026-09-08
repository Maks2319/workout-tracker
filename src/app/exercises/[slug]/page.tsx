import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { MuscleDiagram } from "@/components/MuscleDiagram";

const CATEGORY_LABELS: Record<string, string> = {
  BASIC: "Базовое",
  COMPOUND: "Многофункциональное",
  ISOLATION: "Изоляционное",
};

export default async function ExerciseDetailPage({
  params,
}: PageProps<"/exercises/[slug]">) {
  const { slug } = await params;

  const exercise = await prisma.exercise.findUnique({ where: { slug } });
  if (!exercise) notFound();

  return (
    <main className="flex flex-1 flex-col px-4 py-6">
      <div className="mx-auto w-full max-w-md">
        <Link href="/exercises" className="text-sm text-zinc-500">
          ← К списку
        </Link>

        <h1 className="mt-2 text-xl font-semibold">{exercise.name}</h1>
        <div className="mt-1 flex flex-wrap gap-1.5 text-xs text-zinc-500">
          <span className="rounded-full bg-zinc-200 px-2 py-0.5">
            {CATEGORY_LABELS[exercise.category]}
          </span>
          {exercise.equipment && (
            <span className="rounded-full bg-zinc-200 px-2 py-0.5">
              {exercise.equipment}
            </span>
          )}
          {exercise.level && (
            <span className="rounded-full bg-zinc-200 px-2 py-0.5">
              {exercise.level}
            </span>
          )}
        </div>

        {exercise.images.length > 0 && (
          <div className="mt-4 flex gap-2 overflow-x-auto">
            {exercise.images.map((src) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={src}
                src={src}
                alt={exercise.name}
                className="h-48 shrink-0 rounded-xl border border-zinc-200 object-cover"
              />
            ))}
          </div>
        )}

        <section className="mt-5">
          <h2 className="text-sm font-medium text-zinc-700">
            Задействованные группы мышц
          </h2>
          <div className="mt-2 rounded-xl border border-zinc-200 bg-white p-3">
            <MuscleDiagram
              primaryMuscles={exercise.primaryMuscles}
              secondaryMuscles={exercise.secondaryMuscles}
            />
            <div className="mt-2 flex justify-center gap-4 text-xs text-zinc-500">
              <span className="flex items-center gap-1">
                <span className="h-2.5 w-2.5 rounded-full bg-[#1d4ed8]" />
                основные: {exercise.primaryMuscles.join(", ") || "—"}
              </span>
            </div>
            <div className="mt-1 flex justify-center gap-4 text-xs text-zinc-500">
              <span className="flex items-center gap-1">
                <span className="h-2.5 w-2.5 rounded-full bg-[#93c5fd]" />
                дополнительные: {exercise.secondaryMuscles.join(", ") || "—"}
              </span>
            </div>
          </div>
        </section>

        {exercise.instructions.length > 0 && (
          <section className="mt-5">
            <h2 className="text-sm font-medium text-zinc-700">
              Как выполнять
            </h2>
            <ol className="mt-2 flex flex-col gap-2 text-sm text-zinc-700">
              {exercise.instructions.map((step, i) => (
                <li key={i} className="flex gap-2">
                  <span className="shrink-0 font-medium text-zinc-400">
                    {i + 1}.
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </section>
        )}

        {exercise.tips && (
          <section className="mt-5">
            <h2 className="text-sm font-medium text-zinc-700">Нюансы</h2>
            <p className="mt-2 text-sm text-zinc-700">{exercise.tips}</p>
          </section>
        )}
      </div>
    </main>
  );
}
