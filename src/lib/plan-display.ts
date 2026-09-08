import type { SetType } from "@/generated/prisma/client";

export const SET_TYPE_LABELS: Record<SetType, string> = {
  WARMUP: "Разминка",
  WORKING: "Рабочие",
  DROPSET: "Дропсет",
};

export const GOAL_TYPE_LABELS: Record<string, string> = {
  HYPERTROPHY: "Набор массы",
  STRENGTH: "Сила",
  FAT_LOSS: "Похудение",
  ENDURANCE: "Выносливость",
  GENERAL_FITNESS: "Общая форма",
};

export type PlanSetLike = {
  setIndex: number;
  type: SetType;
  targetReps: string;
  restSeconds: number;
};

export type SetGroup = {
  type: SetType;
  targetReps: string;
  restSeconds: number;
  count: number;
};

// Collapses consecutive sets with identical type/reps/rest into "N × reps" rows for display.
export function groupSets(sets: PlanSetLike[]): SetGroup[] {
  const sorted = [...sets].sort((a, b) => a.setIndex - b.setIndex);
  const groups: SetGroup[] = [];
  for (const s of sorted) {
    const last = groups[groups.length - 1];
    if (
      last &&
      last.type === s.type &&
      last.targetReps === s.targetReps &&
      last.restSeconds === s.restSeconds
    ) {
      last.count++;
    } else {
      groups.push({ type: s.type, targetReps: s.targetReps, restSeconds: s.restSeconds, count: 1 });
    }
  }
  return groups;
}
