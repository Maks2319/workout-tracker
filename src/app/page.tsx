import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function Home() {
  const exerciseCount = await prisma.exercise.count();

  const sections = [
    {
      href: "/exercises",
      title: "Библиотека упражнений",
      description: `${exerciseCount} упражнений с картинками и группами мышц`,
    },
    {
      href: "/plans",
      title: "Мой план тренировок",
      description: "Конструктор плана по дням",
    },
    {
      href: "/workout",
      title: "Тренировка",
      description: "Лог подходов, вес, таймер отдыха",
    },
    {
      href: "/progress",
      title: "Прогресс",
      description: "Графики прогрессии весов",
    },
  ];

  return (
    <main className="flex flex-1 flex-col px-4 py-8 sm:py-12">
      <div className="mx-auto w-full max-w-md">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900">
          Трекер тренировок
        </h1>
        <p className="mt-1.5 text-[15px] leading-relaxed text-zinc-500">
          Личный план, прогрессия весов и AI-анализ нагрузки
        </p>

        <div className="mt-8 flex flex-col gap-3">
          {sections.map((s) => (
            <Link
              key={s.href}
              href={s.href}
              className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm transition-shadow active:shadow-none"
            >
              <div className="text-[16px] font-semibold text-zinc-900">
                {s.title}
              </div>
              <div className="mt-1 text-[14px] leading-snug text-zinc-500">
                {s.description}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
