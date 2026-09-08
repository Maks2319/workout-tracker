"use client";

import { useRouter } from "next/navigation";

// Prefers real browser back navigation (preserves filters/scroll on the
// previous page) and only falls back to a fixed href when there's no
// in-app history to go back to (e.g. opened via a direct link).
export function BackLink({
  fallbackHref,
  children,
}: {
  fallbackHref: string;
  children: React.ReactNode;
}) {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => {
        if (window.history.length > 1) {
          router.back();
        } else {
          router.push(fallbackHref);
        }
      }}
      className="text-sm font-medium text-zinc-500 hover:text-zinc-700"
    >
      {children}
    </button>
  );
}
