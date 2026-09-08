import Link from "next/link";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";

const CATEGORY_LABELS: Record<string, string> = {
  BASIC: "Базовое",
  COMPOUND: "Многофункциональное",
  ISOLATION: "Изоляционное",
};

export default async function ExercisesPage({
  searchParams,
}: PageProps<"/exercises">) {
  const { q, category } = await searchParams;
  const query = typeof q === "string" ? q : "";
  const categoryFilter = typeof category === "string" ? category : "";

  const where: Prisma.ExerciseWhereInput = {
    ...(query
      ? { name: { contains: query, mode: "insensitive" as const } }
      : {}),
    ...(categoryFilter ? { category: categoryFilter as never } : {}),
  };

  const exercises = await prisma.exercise.findMany({
    where,
    orderBy: { name: "asc" },
    take: 60,
    select: { id: true, slug: true, name: true, category: true, images: true },
  });

  return (
    <main className="flex flex-1 flex-col px-4 py-6">
      <div className="mx-auto w-full max-w-md">
        <div className="flex items-center gap-2">
          <Link href="/" className="text-sm text-zinc-500">
            ← Назад
          </Link>
        </div>
        <h1 className="mt-2 text-xl font-semibold">Библиотека упражнений</h1>

        <form className="mt-4 flex flex-col gap-2" method="get">
          <input
            type="text"
            name="q"
            defaultValue={query}
            placeholder="Поиск по названию..."
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm"
          />
          <div className="flex gap-2 overflow-x-auto pb-1">
            {["", "BASIC", "COMPOUND", "ISOLATION"].map((c) => (
              <Link
                key={c}
                href={`/exercises?${c ? `category=${c}` : ""}`}
                className={`shrink-0 rounded-full border px-3 py-1 text-xs ${
                  categoryFilter === c
                    ? "border-zinc-900 bg-zinc-900 text-white"
                    : "border-zinc-300 bg-white text-zinc-600"
                }`}
              >
                {c ? CATEGORY_LABELS[c] : "Все"}
              </Link>
            ))}
          </div>
        </form>

        <div className="mt-4 grid grid-cols-2 gap-3">
          {exercises.map((ex) => (
            <Link
              key={ex.id}
              href={`/exercises/${ex.slug}`}
              className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm"
            >
              <div className="aspect-square w-full bg-zinc-100">
                {ex.images[0] && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={ex.images[0]}
                    alt={ex.name}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                )}
              </div>
              <div className="p-2">
                <div className="line-clamp-2 text-sm font-medium">
                  {ex.name}
                </div>
                <div className="mt-0.5 text-[11px] text-zinc-500">
                  {CATEGORY_LABELS[ex.category]}
                </div>
              </div>
            </Link>
          ))}
        </div>

        {exercises.length === 0 && (
          <p className="mt-8 text-center text-sm text-zinc-500">
            Ничего не найдено
          </p>
        )}
      </div>
    </main>
  );
}
