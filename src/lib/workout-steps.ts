import type { SetType } from "@/generated/prisma/client";

export type WorkoutStepEntry = {
  planDayExerciseId: string;
  exerciseName: string;
  exerciseSlug: string;
  category: string;
  planSetId: string;
  setIndex: number;
  type: SetType;
  targetReps: string;
  restSeconds: number;
  setNote: string | null;
  exerciseNote: string | null;
};

export type WorkoutStep =
  | { kind: "single"; entries: [WorkoutStepEntry] }
  | { kind: "superset"; entries: [WorkoutStepEntry, WorkoutStepEntry] };

type PlanDayExerciseLike = {
  id: string;
  supersetGroup: number | null;
  note: string | null;
  exercise: { name: string; nameRu: string | null; slug: string; category: string };
  plannedSets: {
    id: string;
    setIndex: number;
    type: SetType;
    targetReps: string;
    restSeconds: number;
    note: string | null;
  }[];
};

function toEntries(pde: PlanDayExerciseLike): WorkoutStepEntry[] {
  return [...pde.plannedSets]
    .sort((a, b) => a.setIndex - b.setIndex)
    .map((s) => ({
      planDayExerciseId: pde.id,
      exerciseName: pde.exercise.nameRu ?? pde.exercise.name,
      exerciseSlug: pde.exercise.slug,
      category: pde.exercise.category,
      planSetId: s.id,
      setIndex: s.setIndex,
      type: s.type,
      targetReps: s.targetReps,
      restSeconds: s.restSeconds,
      setNote: s.note,
      exerciseNote: pde.note,
    }));
}

// Builds the ordered sequence of steps a workout session walks through.
// Exercises sharing a supersetGroup are zipped set-by-set into combined
// steps (logged together, no rest in between); everything else is one
// step per planned set.
export function buildWorkoutSteps(dayExercises: PlanDayExerciseLike[]): WorkoutStep[] {
  const blocks: PlanDayExerciseLike[][] = [];
  for (const pde of dayExercises) {
    const prevBlock = blocks[blocks.length - 1];
    const prevEx = prevBlock?.[prevBlock.length - 1];
    if (pde.supersetGroup !== null && prevEx?.supersetGroup === pde.supersetGroup) {
      prevBlock.push(pde);
    } else {
      blocks.push([pde]);
    }
  }

  const steps: WorkoutStep[] = [];
  for (const block of blocks) {
    if (block.length < 2) {
      for (const entry of toEntries(block[0])) {
        steps.push({ kind: "single", entries: [entry] });
      }
      continue;
    }

    const [a, b] = block;
    const entriesA = toEntries(a);
    const entriesB = toEntries(b);
    const pairCount = Math.min(entriesA.length, entriesB.length);
    for (let i = 0; i < pairCount; i++) {
      steps.push({ kind: "superset", entries: [entriesA[i], entriesB[i]] });
    }
    for (let i = pairCount; i < entriesA.length; i++) {
      steps.push({ kind: "single", entries: [entriesA[i]] });
    }
    for (let i = pairCount; i < entriesB.length; i++) {
      steps.push({ kind: "single", entries: [entriesB[i]] });
    }
  }

  return steps;
}

// Groups the flat step list into per-exercise (or per-superset-pair) runs,
// so the UI can show one exercise's full set checklist at a time instead of
// one set per screen.
export function groupStepsIntoSegments(steps: WorkoutStep[]): WorkoutStep[][] {
  const segments: WorkoutStep[][] = [];
  for (const step of steps) {
    const key = step.entries.map((e) => e.planDayExerciseId).join("|");
    const last = segments[segments.length - 1];
    const lastKey = last?.[0].entries.map((e) => e.planDayExerciseId).join("|");
    if (last && lastKey === key) {
      last.push(step);
    } else {
      segments.push([step]);
    }
  }
  return segments;
}

// Finds the first not-yet-logged row so a resumed session reopens exactly
// where it left off, with completed rows still showing as checked.
export function findResumePosition(
  segments: WorkoutStep[][],
  loggedPlanSetIds: Set<string>,
): { segmentIndex: number; rowIndex: number } {
  for (let s = 0; s < segments.length; s++) {
    for (let r = 0; r < segments[s].length; r++) {
      const allLogged = segments[s][r].entries.every((e) => loggedPlanSetIds.has(e.planSetId));
      if (!allLogged) return { segmentIndex: s, rowIndex: r };
    }
  }
  return { segmentIndex: segments.length, rowIndex: 0 };
}
