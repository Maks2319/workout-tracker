export const CATEGORY_LABELS: Record<string, string> = {
  BASIC: "Базовое",
  COMPOUND: "Многофункциональное",
  ISOLATION: "Изоляционное",
};

// Ordered roughly upper body -> core -> lower body, matches free-exercise-db values.
export const MUSCLE_GROUPS: { value: string; label: string }[] = [
  { value: "chest", label: "Грудь" },
  { value: "lats", label: "Широчайшие" },
  { value: "middle back", label: "Середина спины" },
  { value: "lower back", label: "Поясница" },
  { value: "traps", label: "Трапеции" },
  { value: "shoulders", label: "Плечи" },
  { value: "biceps", label: "Бицепс" },
  { value: "triceps", label: "Трицепс" },
  { value: "forearms", label: "Предплечья" },
  { value: "abdominals", label: "Пресс" },
  { value: "quadriceps", label: "Квадрицепс" },
  { value: "hamstrings", label: "Задняя поверхность бедра" },
  { value: "glutes", label: "Ягодицы" },
  { value: "adductors", label: "Приводящие (бедро)" },
  { value: "abductors", label: "Отводящие (бедро)" },
  { value: "calves", label: "Икры" },
  { value: "neck", label: "Шея" },
];

export const MUSCLE_LABELS: Record<string, string> = Object.fromEntries(
  MUSCLE_GROUPS.map((m) => [m.value, m.label]),
);
