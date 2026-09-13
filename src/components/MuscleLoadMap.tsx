"use client";

import Model, { type IExerciseData, type Muscle } from "react-body-highlighter";
import { toHighlighterMuscles } from "@/lib/muscle-map";

const LEVEL_COLORS = ["#dbeafe", "#93c5fd", "#3b82f6", "#1d4ed8"]; // light -> dark, index = level-1

export function MuscleLoadMap({
  levels,
  size = "9rem",
}: {
  levels: Record<string, number>; // muscle -> 1..4 (from toIntensityLevels)
  size?: string;
}) {
  const byLevel = new Map<number, Set<Muscle>>();
  for (const [muscle, level] of Object.entries(levels)) {
    const slugs = toHighlighterMuscles([muscle]);
    if (!byLevel.has(level)) byLevel.set(level, new Set());
    for (const s of slugs) byLevel.get(level)!.add(s as Muscle);
  }

  const data: IExerciseData[] = [...byLevel.entries()].map(([level, muscles]) => ({
    name: `level-${level}`,
    muscles: [...muscles],
    frequency: level,
  }));

  return (
    <div className="flex items-center justify-center gap-2">
      <Model type="anterior" data={data} highlightedColors={LEVEL_COLORS} style={{ width: size }} />
      <Model type="posterior" data={data} highlightedColors={LEVEL_COLORS} style={{ width: size }} />
    </div>
  );
}
