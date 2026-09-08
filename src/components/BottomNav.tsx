"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  {
    href: "/exercises",
    label: "Библиотека",
    icon: (active: boolean) => (
      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
        <rect x="2" y="10" width="3" height="4" rx="1" fill={active ? "#0f172a" : "#a1a1aa"} />
        <rect x="19" y="10" width="3" height="4" rx="1" fill={active ? "#0f172a" : "#a1a1aa"} />
        <rect x="6" y="8" width="2.5" height="8" rx="1" fill={active ? "#0f172a" : "#a1a1aa"} />
        <rect x="15.5" y="8" width="2.5" height="8" rx="1" fill={active ? "#0f172a" : "#a1a1aa"} />
        <rect x="8.5" y="11" width="7" height="2" fill={active ? "#0f172a" : "#a1a1aa"} />
      </svg>
    ),
  },
  {
    href: "/plans",
    label: "План",
    icon: (active: boolean) => (
      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
        <rect x="3" y="4" width="18" height="17" rx="2.5" stroke={active ? "#0f172a" : "#a1a1aa"} strokeWidth="2" />
        <line x1="3" y1="9" x2="21" y2="9" stroke={active ? "#0f172a" : "#a1a1aa"} strokeWidth="2" />
        <line x1="7.5" y1="2.5" x2="7.5" y2="5.5" stroke={active ? "#0f172a" : "#a1a1aa"} strokeWidth="2" strokeLinecap="round" />
        <line x1="16.5" y1="2.5" x2="16.5" y2="5.5" stroke={active ? "#0f172a" : "#a1a1aa"} strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: "/workout",
    label: "Тренировка",
    icon: (active: boolean) => (
      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
        <polygon points="6,4 20,12 6,20" fill={active ? "#0f172a" : "#a1a1aa"} />
      </svg>
    ),
  },
  {
    href: "/progress",
    label: "Прогресс",
    icon: (active: boolean) => (
      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
        <rect x="3" y="13" width="4" height="8" rx="1" fill={active ? "#0f172a" : "#a1a1aa"} />
        <rect x="10" y="8" width="4" height="13" rx="1" fill={active ? "#0f172a" : "#a1a1aa"} />
        <rect x="17" y="3" width="4" height="18" rx="1" fill={active ? "#0f172a" : "#a1a1aa"} />
      </svg>
    ),
  },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-20 border-t border-zinc-200 bg-white/90 backdrop-blur"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="mx-auto flex max-w-md">
        {TABS.map((tab) => {
          const active = pathname === tab.href || pathname.startsWith(tab.href + "/");
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className="flex flex-1 flex-col items-center gap-1 py-2.5"
            >
              {tab.icon(active)}
              <span
                className={`text-[11px] font-medium ${active ? "text-zinc-900" : "text-zinc-400"}`}
              >
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
