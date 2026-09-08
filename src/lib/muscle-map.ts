// Maps free-exercise-db muscle names to react-body-highlighter slugs.
// Approximate where there's no 1:1 anatomical match (e.g. "lats"/"middle back" -> upper-back).
const MUSCLE_MAP: Record<string, string[]> = {
  abdominals: ["abs"],
  abductors: ["abductors"],
  adductors: ["adductor"],
  biceps: ["biceps"],
  calves: ["calves"],
  chest: ["chest"],
  forearms: ["forearm"],
  glutes: ["gluteal"],
  hamstrings: ["hamstring"],
  lats: ["upper-back"],
  "lower back": ["lower-back"],
  "middle back": ["upper-back"],
  neck: ["neck"],
  quadriceps: ["quadriceps"],
  shoulders: ["front-deltoids", "back-deltoids"],
  traps: ["trapezius"],
};

export function toHighlighterMuscles(muscles: string[]): string[] {
  const result = new Set<string>();
  for (const m of muscles) {
    for (const slug of MUSCLE_MAP[m] ?? []) {
      result.add(slug);
    }
  }
  return [...result];
}
