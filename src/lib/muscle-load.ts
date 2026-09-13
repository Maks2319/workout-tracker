import type { SetType } from "@/generated/prisma/client";

type ExerciseLike = {
  primaryMuscles: string[];
  secondaryMuscles: string[];
};

type PlanDayExerciseLike = {
  exercise: ExerciseLike;
  plannedSets: { type: SetType }[];
};

// "Hard sets" (working + dropset) per exercise, weighted full for primary
// movers and half for secondary movers — the standard convention used when
// tallying sets-per-muscle for volume landmarks (MEV/MAV/MRV-style tracking).
export function computeMuscleLoad(exercises: PlanDayExerciseLike[]): Record<string, number> {
  const load: Record<string, number> = {};

  for (const pde of exercises) {
    const hardSets = pde.plannedSets.filter((s) => s.type !== "WARMUP").length;
    if (hardSets === 0) continue;

    for (const m of pde.exercise.primaryMuscles) {
      load[m] = (load[m] ?? 0) + hardSets;
    }
    for (const m of pde.exercise.secondaryMuscles) {
      load[m] = (load[m] ?? 0) + hardSets * 0.5;
    }
  }

  return load;
}

export function mergeLoads(loads: Record<string, number>[]): Record<string, number> {
  const merged: Record<string, number> = {};
  for (const load of loads) {
    for (const [muscle, value] of Object.entries(load)) {
      merged[muscle] = (merged[muscle] ?? 0) + value;
    }
  }
  return merged;
}

// Buckets raw set-equivalents into 1..levels relative to the highest-loaded
// muscle in the set, for coloring a body diagram (0 / untouched is omitted).
export function toIntensityLevels(
  load: Record<string, number>,
  levels = 4,
): Record<string, number> {
  const max = Math.max(0, ...Object.values(load));
  if (max === 0) return {};

  const result: Record<string, number> = {};
  for (const [muscle, value] of Object.entries(load)) {
    if (value <= 0) continue;
    result[muscle] = Math.min(levels, Math.max(1, Math.ceil((value / max) * levels)));
  }
  return result;
}
