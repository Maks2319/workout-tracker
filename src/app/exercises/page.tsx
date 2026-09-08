import Link from "next/link";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";
import { CATEGORY_LABELS, MUSCLE_GROUPS, MUSCLE_LABELS, displayName } from "@/lib/exercise-labels";

function buildHref(params: {
  q?: string;
  category?: string;
  muscle?: string;
}) {
  const sp = new URLSearchParams();
  if (params.q) sp.set("q", params.q);
  if (params.category) sp.set("category", params.category);
  if (params.muscle) sp.set("muscle", params.muscle);
  const qs = sp.toString();
  return qs ? `/exercises?${qs}` : "/exercises";
}

export default async function ExercisesPage({
  searchParams,
}: PageProps<"/exercises">) {
  const sp = await searchParams;
  const query = typeof sp.q === "string" ? sp.q : "";
  const categoryFilter = typeof sp.category === "string" ? sp.category : "";
  const muscleFilter = typeof sp.muscle === "string" ? sp.muscle : "";

  const where: Prisma.ExerciseWhereInput = {
    ...(query
      ? {
          OR: [
            { name: { contains: query, mode: "insensitive" as const } },
            { nameRu: { contains: query, mode: "insensitive" as const } },
          ],
        }
      : {}),
    ...(categoryFilter ? { category: categoryFilter as never } : {}),
    ...(muscleFilter ? { primaryMuscles: { has: muscleFilter } } : {}),
  };

  const exercises = await prisma.exercise.findMany({
    where,
    orderBy: { name: "asc" },
    take: 60,
    select: {
      id: true,
      slug: true,
      name: true,
      nameRu: true,
      category: true,
      images: true,
      primaryMuscles: true,
    },
  });

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
          Библиотека упражнений
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          {exercises.length} упражнений — фильтруйте по типу и группе мышц
        </p>

        <form className="mt-5 flex flex-col gap-3" method="get">
          {muscleFilter && (
            <input type="hidden" name="muscle" value={muscleFilter} />
          )}
          <input
            type="text"
            name="q"
            defaultValue={query}
            placeholder="Поиск по названию..."
            className="rounded-xl border border-zinc-300 bg-white px-3.5 py-2.5 text-[15px] text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-500 focus:outline-none"
          />

          <div>
            <div className="mb-1.5 text-xs font-medium uppercase tracking-wide text-zinc-400">
              Тип упражнения
            </div>
            <div className="flex gap-1.5 overflow-x-auto pb-1">
              {["", "BASIC", "COMPOUND", "ISOLATION"].map((c) => (
                <Link
                  key={c}
                  href={buildHref({ q: query, category: c, muscle: muscleFilter })}
                  className={`shrink-0 rounded-full border px-3 py-1.5 text-[13px] font-medium transition-colors ${
                    categoryFilter === c
                      ? "border-zinc-900 bg-zinc-900 text-white"
                      : "border-zinc-200 bg-white text-zinc-600 active:bg-zinc-100"
                  }`}
                >
                  {c ? CATEGORY_LABELS[c] : "Все"}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <label
              htmlFor="muscle"
              className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-zinc-400"
            >
              Группа мышц
            </label>
            <select
              id="muscle"
              name="muscle"
              defaultValue={muscleFilter}
              className="w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-2.5 text-[15px] text-zinc-900 focus:border-zinc-500 focus:outline-none"
            >
              <option value="">Все группы мышц</option>
              {MUSCLE_GROUPS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
            {categoryFilter && (
              <input type="hidden" name="category" value={categoryFilter} />
            )}
          </div>

          <button
            type="submit"
            className="rounded-xl bg-zinc-900 py-2.5 text-[15px] font-semibold text-white active:bg-zinc-800"
          >
            Применить
          </button>
        </form>

        <div className="mt-5 grid grid-cols-2 gap-3">
          {exercises.map((ex) => (
            <Link
              key={ex.id}
              href={`/exercises/${ex.slug}`}
              className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition-shadow active:shadow-none"
            >
              <div className="aspect-square w-full bg-zinc-100">
                {ex.images[0] && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={ex.images[0]}
                    alt={displayName(ex)}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                )}
              </div>
              <div className="p-3">
                <div className="line-clamp-2 text-[14px] font-semibold leading-snug text-zinc-900">
                  {displayName(ex)}
                </div>
                <div className="mt-1.5 flex flex-wrap gap-1">
                  <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-500">
                    {CATEGORY_LABELS[ex.category]}
                  </span>
                  {ex.primaryMuscles[0] && (
                    <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-500">
                      {MUSCLE_LABELS[ex.primaryMuscles[0]] ?? ex.primaryMuscles[0]}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>

        {exercises.length === 0 && (
          <p className="mt-10 text-center text-sm text-zinc-400">
            Ничего не найдено
          </p>
        )}
      </div>
    </main>
  );
}
