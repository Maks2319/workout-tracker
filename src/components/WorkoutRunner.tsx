"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import type { WorkoutStep } from "@/lib/workout-steps";
import { logSets, finishSession, type LoggedSetEntry } from "@/app/workout/actions";

const SET_TYPE_LABELS: Record<string, string> = {
  WARMUP: "Разминка",
  WORKING: "Рабочий",
  DROPSET: "Дропсет",
};

type FieldValue = { weight: string; reps: string };
type ExistingLogs = Record<string, { weightKg: number | null; reps: number | null }>;
type RowStatus = "done" | "active" | "locked";

export function WorkoutRunner({
  sessionId,
  dayName,
  segments,
  existingLogs,
  startSegmentIndex,
  startRowIndex,
}: {
  sessionId: string;
  dayName: string;
  segments: WorkoutStep[][];
  existingLogs: ExistingLogs;
  startSegmentIndex: number;
  startRowIndex: number;
}) {
  const [segmentIndex, setSegmentIndex] = useState(startSegmentIndex);
  const [phase, setPhase] = useState<"exercise" | "finish">(
    startSegmentIndex >= segments.length ? "finish" : "exercise",
  );
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

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

  const goToNextSegment = useCallback(() => {
    setSegmentIndex((i) => {
      const next = i + 1;
      setPhase(next >= segments.length ? "finish" : "exercise");
      return next;
    });
  }, [segments.length]);

  const segment = segmentIndex < segments.length ? segments[segmentIndex] : null;
  const isLastSegment = segmentIndex === segments.length - 1;

  return (
    <main className="flex flex-1 flex-col px-4 py-6 sm:py-8">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[13px] font-semibold uppercase tracking-wide text-zinc-400">
              {dayName}
            </div>
            <div className="text-sm text-zinc-500">
              Упражнение {Math.min(segmentIndex + 1, segments.length)} из {segments.length}
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

        {phase === "exercise" && segment && (
          <ExerciseSegment
            key={segmentIndex}
            sessionId={sessionId}
            segment={segment}
            existingLogs={existingLogs}
            startRowIndex={segmentIndex === startSegmentIndex ? startRowIndex : 0}
            isLastSegment={isLastSegment}
            beep={beep}
            onSegmentComplete={goToNextSegment}
          />
        )}

        {phase === "finish" && <FinishForm sessionId={sessionId} />}
      </div>
    </main>
  );
}

function ExerciseSegment({
  sessionId,
  segment,
  existingLogs,
  startRowIndex,
  isLastSegment,
  beep,
  onSegmentComplete,
}: {
  sessionId: string;
  segment: WorkoutStep[];
  existingLogs: ExistingLogs;
  startRowIndex: number;
  isLastSegment: boolean;
  beep: () => void;
  onSegmentComplete: () => void;
}) {
  const rows = segment;
  const isSuperset = rows[0].kind === "superset";

  const [rowIndex, setRowIndex] = useState(startRowIndex);
  const [completed, setCompleted] = useState<boolean[]>(() => rows.map((_, i) => i < startRowIndex));
  const [values, setValues] = useState<FieldValue[][]>(() =>
    rows.map((row) =>
      row.entries.map((e) => {
        const log = existingLogs[e.planSetId];
        return {
          weight: log?.weightKg != null ? String(log.weightKg) : "",
          reps: log?.reps != null ? String(log.reps) : "",
        };
      }),
    ),
  );
  const [resting, setResting] = useState(false);
  const [restRemaining, setRestRemaining] = useState(0);
  const [restTotal, setRestTotal] = useState(0);
  const [, startTransition] = useTransition();

  const advanceAfterRow = useCallback(
    (i: number) => {
      if (i + 1 >= rows.length) {
        onSegmentComplete();
      } else {
        setRowIndex(i + 1);
      }
    },
    [rows.length, onSegmentComplete],
  );

  // Rest countdown — zero-check happens inside the timer callback, not
  // synchronously in the effect body.
  useEffect(() => {
    if (!resting) return;
    const t = setTimeout(() => {
      if (restRemaining <= 1) {
        beep();
        setResting(false);
        advanceAfterRow(rowIndex);
      } else {
        setRestRemaining((r) => r - 1);
      }
    }, 1000);
    return () => clearTimeout(t);
  }, [resting, restRemaining, beep, rowIndex, advanceAfterRow]);

  function handleConfirmRow(i: number) {
    const row = rows[i];
    const entries: LoggedSetEntry[] = row.entries.map((e, k) => ({
      planDayExerciseId: e.planDayExerciseId,
      planSetId: e.planSetId,
      setIndex: e.setIndex,
      type: e.type,
      weightKg: values[i][k]?.weight ? parseFloat(values[i][k].weight.replace(",", ".")) : null,
      reps: values[i][k]?.reps ? parseInt(values[i][k].reps, 10) : null,
    }));
    startTransition(() => {
      logSets(sessionId, entries);
    });

    setCompleted((c) => {
      const next = [...c];
      next[i] = true;
      return next;
    });

    if (i === rows.length - 1 && isLastSegment) {
      onSegmentComplete();
      return;
    }
    const rest = row.entries[row.entries.length - 1].restSeconds;
    setRestTotal(rest);
    setRestRemaining(rest);
    setResting(true);
  }

  function handleSkipRest() {
    beep();
    setResting(false);
    advanceAfterRow(rowIndex);
  }

  const first = rows[0].entries[0];
  const second = isSuperset ? rows[0].entries[1] : null;

  return (
    <div className="mt-5 flex flex-1 flex-col gap-4">
      {isSuperset && (
        <div className="rounded-xl bg-amber-50 px-3 py-1.5 text-[12px] font-semibold uppercase tracking-wide text-amber-700">
          Суперсет — без отдыха между упражнениями
        </div>
      )}

      <div className="rounded-2xl border border-zinc-200 bg-white p-4">
        <Link href={`/exercises/${first.exerciseSlug}`} className="text-lg font-semibold text-zinc-900">
          {first.exerciseName}
        </Link>
        {first.exerciseNote && (
          <p className="mt-1.5 rounded-lg bg-zinc-50 p-2 text-[13px] leading-relaxed text-zinc-600">
            {first.exerciseNote}
          </p>
        )}
        {second && (
          <>
            <Link
              href={`/exercises/${second.exerciseSlug}`}
              className="mt-3 block text-lg font-semibold text-zinc-900"
            >
              + {second.exerciseName}
            </Link>
            {second.exerciseNote && (
              <p className="mt-1.5 rounded-lg bg-zinc-50 p-2 text-[13px] leading-relaxed text-zinc-600">
                {second.exerciseNote}
              </p>
            )}
          </>
        )}
      </div>

      <div className="flex flex-col gap-2">
        {rows.map((row, i) => {
          const status: RowStatus = completed[i] ? "done" : i === rowIndex ? "active" : "locked";
          return (
            <SetRow
              key={i}
              row={row}
              index={i}
              isSuperset={isSuperset}
              status={status}
              values={values[i]}
              onChange={(k, field, val) =>
                setValues((v) => {
                  const next = v.map((row) => [...row]);
                  next[i][k] = { ...next[i][k], [field]: val };
                  return next;
                })
              }
              onConfirm={() => handleConfirmRow(i)}
            />
          );
        })}
      </div>

      {resting && (
        <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-center">
          <div className="text-xs font-medium text-zinc-500">Отдых</div>
          <div className="mt-1 text-4xl font-bold tabular-nums text-zinc-900">
            {Math.floor(restRemaining / 60)}:{String(restRemaining % 60).padStart(2, "0")}
          </div>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-zinc-200">
            <div
              className="h-full bg-zinc-900 transition-all"
              style={{
                width: `${restTotal > 0 ? (100 * (restTotal - restRemaining)) / restTotal : 100}%`,
              }}
            />
          </div>
          <div className="mt-3 flex justify-center gap-2">
            <button
              onClick={() => setRestRemaining((r) => r + 15)}
              className="rounded-full border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-600"
            >
              +15с
            </button>
            <button
              onClick={() => setRestRemaining((r) => Math.max(0, r - 15))}
              className="rounded-full border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-600"
            >
              −15с
            </button>
            <button
              onClick={handleSkipRest}
              className="rounded-full bg-zinc-900 px-4 py-1.5 text-xs font-semibold text-white"
            >
              Пропустить
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function SetRow({
  row,
  index,
  isSuperset,
  status,
  values,
  onChange,
  onConfirm,
}: {
  row: WorkoutStep;
  index: number;
  isSuperset: boolean;
  status: RowStatus;
  values: FieldValue[];
  onChange: (entryIndex: number, field: "weight" | "reps", value: string) => void;
  onConfirm: () => void;
}) {
  return (
    <div
      className={`rounded-xl border p-3 transition-colors ${
        status === "active"
          ? "border-zinc-900 bg-white"
          : status === "done"
            ? "border-zinc-200 bg-zinc-50"
            : "border-zinc-100 bg-zinc-50/60"
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-[13px]">
          <span
            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold ${
              status === "done" ? "bg-emerald-600 text-white" : "bg-zinc-200 text-zinc-500"
            }`}
          >
            {status === "done" ? "✓" : index + 1}
          </span>
          <span className={status === "locked" ? "text-zinc-300" : "font-medium text-zinc-700"}>
            Подход {index + 1}
          </span>
          <span className={status === "locked" ? "text-zinc-300" : "text-zinc-400"}>
            {SET_TYPE_LABELS[row.entries[0].type]} · цель {row.entries[0].targetReps}
          </span>
        </div>
      </div>

      <div className="mt-2 flex flex-col gap-2">
        {row.entries.map((entry, k) => (
          <div key={k} className="flex items-center gap-2">
            {isSuperset && (
              <span
                className={`w-24 shrink-0 truncate text-[12px] ${
                  status === "locked" ? "text-zinc-300" : "text-zinc-500"
                }`}
              >
                {entry.exerciseName}
              </span>
            )}
            {status === "done" ? (
              <span className="text-[15px] font-medium text-zinc-700">
                {values[k]?.weight || "—"} кг × {values[k]?.reps || "—"}
              </span>
            ) : status === "active" ? (
              <>
                <input
                  type="number"
                  inputMode="decimal"
                  step="0.5"
                  placeholder="кг"
                  value={values[k]?.weight ?? ""}
                  onChange={(e) => onChange(k, "weight", e.target.value)}
                  className="w-20 rounded-lg border border-zinc-300 px-2.5 py-1.5 text-[15px]"
                />
                <input
                  type="number"
                  inputMode="numeric"
                  placeholder="повторы"
                  value={values[k]?.reps ?? ""}
                  onChange={(e) => onChange(k, "reps", e.target.value)}
                  className="w-20 rounded-lg border border-zinc-300 px-2.5 py-1.5 text-[15px]"
                />
              </>
            ) : (
              <span className="text-[13px] text-zinc-300">—</span>
            )}
          </div>
        ))}
      </div>

      {status === "active" && (
        <button
          onClick={onConfirm}
          className="mt-3 w-full rounded-xl bg-zinc-900 py-2.5 text-[14px] font-semibold text-white active:bg-zinc-800"
        >
          ✓ Подход выполнен
        </button>
      )}
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
