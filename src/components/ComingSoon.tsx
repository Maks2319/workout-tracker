import Link from "next/link";

export function ComingSoon({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
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
          {title}
        </h1>
        <p className="mt-2 text-[15px] leading-relaxed text-zinc-500">
          {description}
        </p>
        <div className="mt-6 rounded-2xl border border-dashed border-zinc-300 p-8 text-center text-sm font-medium text-zinc-400">
          В разработке
        </div>
      </div>
    </main>
  );
}
