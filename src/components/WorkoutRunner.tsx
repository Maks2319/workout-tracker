"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import type { WorkoutStep } from "@/lib/workout-steps";
import { logSets, finishSession, type LoggedSetEntry } from "@/app/workout/actions";

const SET_TYPE_LABELS: Record<string, string> = {
  WARMUP: "Разминка",
  WORKING: "Рабочий подход",
  DROPSET: "Дропсет",
};

type Phase = "input" | "resting" | "finish";

type FieldValue = { weight: string; reps: string };

export function WorkoutRunner({
  sessionId,
  dayName,
  steps,
  startIndex,
}: {
  sessionId: string;
  dayName: string;
  steps: WorkoutStep[];
  startIndex: number;
}) {
  const [index, setIndex] = useState(startIndex);
  const [phase, setPhase] = useState<Phase>(startIndex >= steps.length ? "finish" : "input");
  const [restRemaining, setRestRemaining] = useState(0);
  const [restTotal, setRestTotal] = useState(0);
  const [, startTransition] = useTransition();
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const step = index < steps.length ? steps[index] : null;
  const totalSets = steps.length;

  // Keep the screen on for the duration of the workout.
  useEffect(() => {
    let cancelled = false;
    async function requestLock() {
      try {
        if ("wakeLock" in navigator) {
          wakeLockRef.current = await navigator.wakeLock.request("screen");
        }
      } catch {
        // Wake Lock unsupported or denied — not fatal, workout still works.
      }
    }
    if (!cancelled) requestLock();
    function onVisibility() {
      if (document.visibilityState === "visible") requestLock();
    }
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisibility);
      wakeLockRef.current?.release().catch(() => {});
    };
  }, []);

  const beep = useCallback(() => {
    try {
      const Ctx = window.AudioContext;
      if (!audioCtxRef.current) audioCtxRef.current = new Ctx();
      const ctx = audioCtxRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = 880;
      osc.connect(gain);
      gain.connect(ctx.destination);
      gain.gain.setValueAtTime(0.001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
      osc.start();
      osc.stop(ctx.currentTime + 0.5);
    } catch {
      // Audio unsupported — vibration below still fires.
    }
    if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
  }, []);

  const goToNext = useCallback(() => {
    setIndex((i) => {
      const next = i + 1;
      setPhase(next >= steps.length ? "finish" : "input");
      return next;
    });
  }, [steps.length]);

  // Rest countdown — the zero-check and transition happen inside the timer
  // callback (not synchronously in the effect body) so they only ever fire
  // in response to the external clock ticking.
  useEffect(() => {
    if (phase !== "resting") return;
    const t = setTimeout(() => {
      if (restRemaining <= 1) {
        beep();
        goToNext();
      } else {
        setRestRemaining((r) => r - 1);
      }
    }, 1000);
    return () => clearTimeout(t);
  }, [phase, restRemaining, beep, goToNext]);

  function handleDone(values: FieldValue[]) {
    if (!step) return;
    const entries: LoggedSetEntry[] = step.entries.map((e, i) => ({
      planDayExerciseId: e.planDayExerciseId,
      planSetId: e.planSetId,
      setIndex: e.setIndex,
      type: e.type,
      weightKg: values[i]?.weight ? parseFloat(values[i].weight.replace(",", ".")) : null,
      reps: values[i]?.reps ? parseInt(values[i].reps, 10) : null,
    }));
    startTransition(() => {
      logSets(sessionId, entries);
    });

    if (index === steps.length - 1) {
      goToNext();
      return;
    }
    const rest = step.entries[step.entries.length - 1].restSeconds;
    setRestRemaining(rest);
    setRestTotal(rest);
    setPhase("resting");
  }

  function handleSkipRest() {
    beep();
    goToNext();
  }

  const nextStep = steps[index + 1];

  return (
    <main className="flex flex-1 flex-col px-4 py-6 sm:py-8">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[13px] font-semibold uppercase tracking-wide text-zinc-400">
              {dayName}
            </div>
            <div className="text-sm text-zinc-500">
              Шаг {Math.min(index + 1, totalSets)} из {totalSets}
            </div>
          </div>
          {phase !== "finish" && (
            <button
              onClick={() => setPhase("finish")}
              className="text-xs font-medium text-zinc-400 underline"
            >
              Закончить раньше
            </button>
          )}
        </div>

        {phase === "input" && step && (
          <StepInputs key={index} step={step} onDone={handleDone} />
        )}

        {phase === "resting" && (
          <div className="mt-5 flex flex-1 flex-col items-center justify-center gap-6 text-center">
            <div className="text-sm font-medium text-zinc-500">Отдых</div>
            <div className="text-7xl font-bold tabular-nums text-zinc-900">
              {Math.floor(restRemaining / 60)}:{String(restRemaining % 60).padStart(2, "0")}
            </div>
            <div className="h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-zinc-200">
              <div
                className="h-full bg-zinc-900 transition-all"
                style={{
                  width: `${restTotal > 0 ? (100 * (restTotal - restRemaining)) / restTotal : 100}%`,
                }}
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setRestRemaining((r) => r + 15)}
                className="rounded-full border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-600"
              >
                +15с
              </button>
              <button
                onClick={() => setRestRemaining((r) => Math.max(0, r - 15))}
                className="rounded-full border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-600"
              >
                −15с
              </button>
            </div>
            {nextStep && (
              <div className="mt-2 text-sm text-zinc-400">
                Далее: {nextStep.entries.map((e) => e.exerciseName).join(" + ")}
              </div>
            )}
            <button
              onClick={handleSkipRest}
              className="mt-4 rounded-2xl bg-zinc-900 px-8 py-3 text-[15px] font-semibold text-white active:bg-zinc-800"
            >
              Пропустить отдых
            </button>
          </div>
        )}

        {phase === "finish" && (
          <FinishForm sessionId={sessionId} />
        )}
      </div>
    </main>
  );
}

function StepInputs({
  step,
  onDone,
}: {
  step: WorkoutStep;
  onDone: (values: FieldValue[]) => void;
}) {
  const [values, setValues] = useState<FieldValue[]>(
    step.entries.map(() => ({ weight: "", reps: "" })),
  );

  return (
    <div className="mt-5 flex flex-1 flex-col gap-4">
      {step.kind === "superset" && (
        <div className="rounded-xl bg-amber-50 px-3 py-1.5 text-[12px] font-semibold uppercase tracking-wide text-amber-700">
          Суперсет — без отдыха между упражнениями
        </div>
      )}
      {step.entries.map((entry, i) => (
        <div key={entry.planSetId} className="rounded-2xl border border-zinc-200 bg-white p-4">
          <Link
            href={`/exercises/${entry.exerciseSlug}`}
            className="text-lg font-semibold text-zinc-900"
          >
            {entry.exerciseName}
          </Link>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-[13px] text-zinc-500">
            <span>{SET_TYPE_LABELS[entry.type]}</span>
            <span>· цель: {entry.targetReps}</span>
          </div>
          {entry.exerciseNote && (
            <p className="mt-2 rounded-lg bg-zinc-50 p-2 text-[13px] leading-relaxed text-zinc-600">
              {entry.exerciseNote}
            </p>
          )}
          <div className="mt-3 flex gap-3">
            <label className="flex-1">
              <span className="text-xs font-medium text-zinc-400">Вес, кг</span>
              <input
                type="number"
                inputMode="decimal"
                step="0.5"
                value={values[i]?.weight ?? ""}
                onChange={(e) =>
                  setValues((v) => {
                    const next = [...v];
                    next[i] = { ...next[i], weight: e.target.value };
                    return next;
                  })
                }
                className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-[16px]"
              />
            </label>
            <label className="flex-1">
              <span className="text-xs font-medium text-zinc-400">Повторы</span>
              <input
                type="number"
                inputMode="numeric"
                value={values[i]?.reps ?? ""}
                onChange={(e) =>
                  setValues((v) => {
                    const next = [...v];
                    next[i] = { ...next[i], reps: e.target.value };
                    return next;
                  })
                }
                className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-[16px]"
              />
            </label>
          </div>
        </div>
      ))}

      <button
        onClick={() => onDone(values)}
        className="mt-auto rounded-2xl bg-zinc-900 py-4 text-[16px] font-semibold text-white active:bg-zinc-800"
      >
        Подход выполнен
      </button>
    </div>
  );
}

function FinishForm({ sessionId }: { sessionId: string }) {
  const [rating, setRating] = useState<number | null>(null);
  const [notes, setNotes] = useState("");
  const [isPending, startTransition] = useTransition();

  return (
    <div className="mt-5 flex flex-1 flex-col gap-5">
      <div>
        <h2 className="text-xl font-bold text-zinc-900">Тренировка завершена 🎉</h2>
        <p className="mt-1 text-sm text-zinc-500">Как всё прошло?</p>
      </div>

      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            onClick={() => setRating(n)}
            className={`flex-1 rounded-xl border py-3 text-lg font-semibold ${
              rating === n
                ? "border-zinc-900 bg-zinc-900 text-white"
                : "border-zinc-200 bg-white text-zinc-400"
            }`}
          >
            {n}
          </button>
        ))}
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-medium text-zinc-400">Комментарий (необязательно)</span>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
          placeholder="Как самочувствие, что заметили по весам..."
          className="rounded-xl border border-zinc-300 px-3 py-2 text-[15px]"
        />
      </label>

      <button
        disabled={isPending}
        onClick={() =>
          startTransition(() => {
            finishSession(sessionId, rating, notes || null);
          })
        }
        className="mt-auto rounded-2xl bg-zinc-900 py-4 text-[16px] font-semibold text-white active:bg-zinc-800 disabled:opacity-50"
      >
        Сохранить
      </button>
    </div>
  );
}
