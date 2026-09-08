"use client";

import Model, { type IExerciseData, type Muscle } from "react-body-highlighter";
import { toHighlighterMuscles } from "@/lib/muscle-map";

const HIGHLIGHTED_COLORS = ["#93c5fd", "#1d4ed8"]; // [secondary, primary]

export function MuscleDiagram({
  primaryMuscles,
  secondaryMuscles,
}: {
  primaryMuscles: string[];
  secondaryMuscles: string[];
}) {
  const data: IExerciseData[] = [
    {
      name: "primary",
      muscles: toHighlighterMuscles(primaryMuscles) as Muscle[],
      frequency: 2,
    },
    {
      name: "secondary",
      muscles: toHighlighterMuscles(secondaryMuscles) as Muscle[],
      frequency: 1,
    },
  ].filter((d) => d.muscles.length > 0);

  return (
    <div className="flex items-center justify-center gap-4">
      <Model
        type="anterior"
        data={data}
        highlightedColors={HIGHLIGHTED_COLORS}
        style={{ width: "11.5rem" }}
      />
      <Model
        type="posterior"
        data={data}
        highlightedColors={HIGHLIGHTED_COLORS}
        style={{ width: "11.5rem" }}
      />
    </div>
  );
}
