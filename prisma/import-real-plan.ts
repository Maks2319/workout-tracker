import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import type { ExerciseCategory, SetType } from "../src/generated/prisma/client";

const USER_EMAIL = "enriquevancesebe@outlook.com";

type SetSpec = {
  type: SetType;
  reps: string;
  count: number;
  note?: string;
  restSeconds?: number; // override the category-based default
};

type CustomExerciseDef = {
  kind: "custom";
  slug: string;
  name: string;
  category: ExerciseCategory;
  equipment?: string;
  primaryMuscles: string[];
  secondaryMuscles: string[];
};

type LibraryRef = { kind: "library"; slug: string };

type ExerciseSpec = {
  match: LibraryRef | CustomExerciseDef;
  tip?: string;
  supersetGroup?: number;
  sets: SetSpec[];
};

type DaySpec = { dayIndex: number; name: string; exercises: ExerciseSpec[] };

function lib(slug: string): LibraryRef {
  return { kind: "library", slug };
}

const PLAN: DaySpec[] = [
  {
    dayIndex: 1,
    name: "День 1 — Грудь",
    exercises: [
      {
        match: {
          kind: "custom",
          slug: "custom-lever-incline-chest-press",
          name: "Жим в рычажном тренажёре (наклонный)",
          category: "COMPOUND",
          equipment: "machine",
          primaryMuscles: ["chest"],
          secondaryMuscles: ["shoulders", "triceps"],
        },
        tip: "Первые рабочие — взрывной жим вверх, медленно вниз 3 сек",
        sets: [
          { type: "WARMUP", reps: "20", count: 1, note: "лёгкий вес" },
          { type: "WARMUP", reps: "15", count: 1, note: "средний вес" },
          { type: "WORKING", reps: "10", count: 5, note: "рабочий вес — тяжелее чем раньше" },
        ],
      },
      {
        match: lib("incline-dumbbell-press"),
        tip: "Опускай максимально низко, чувствуй растяжку грудных",
        sets: [
          { type: "WARMUP", reps: "15", count: 1 },
          { type: "WORKING", reps: "12", count: 4, note: "глубокая растяжка внизу — пауза 1 сек" },
        ],
      },
      {
        match: lib("barbell-bench-press---medium-grip"),
        tip: "Основной массонаборный жим — не бойся повышать вес каждые 2 недели",
        sets: [
          { type: "WARMUP", reps: "15", count: 1 },
          { type: "WORKING", reps: "8-10", count: 5, note: "ТЯЖЁЛЫЙ блок — акцент на масс" },
        ],
      },
      {
        match: lib("dips---chest-version"),
        tip: "Наклоняй корпус вперёд ~30°. Опускайся до лёгкого натяжения в груди. С прогрессом добавляй вес на пояс.",
        sets: [{ type: "WORKING", reps: "max", count: 4, note: "наклон вперёд — акцент грудь, не трицепс" }],
      },
      {
        match: lib("cable-crossover"),
        tip: "Это ключевое движение для растяжки и объёма. Каретки на уровне груди. Пауза 2 сек внизу.",
        sets: [{ type: "WORKING", reps: "15", count: 4, note: "ПАУЗА ВНИЗУ — максимальная растяжка" }],
      },
      {
        match: lib("low-cable-crossover"),
        tip: "Небольшой вес, концентрация на прожатии грудных в верхней точке",
        sets: [{ type: "WORKING", reps: "15", count: 3, note: "с прожатием и паузой наверху" }],
      },
      {
        match: lib("butterfly"),
        tip: "Последнее упражнение — пампинг и прожатие. Не торопись.",
        sets: [{ type: "WORKING", reps: "15-20", count: 3, note: "финишный изоляционный блок" }],
      },
    ],
  },
  {
    dayIndex: 2,
    name: "День 2 — Спина + Задняя дельта",
    exercises: [
      {
        match: lib("pullups"),
        tip: "Негативные повторения считаются. Медленно вниз 3-4 сек. Каждую неделю добавляй 1 повторение.",
        sets: [{ type: "WORKING", reps: "max", count: 4, note: "если сложно — с резиной/ассистором" }],
      },
      {
        match: lib("wide-grip-lat-pulldown"),
        tip: "Тянешь локтями вниз, не руками",
        sets: [
          { type: "WARMUP", reps: "20", count: 1 },
          { type: "WORKING", reps: "15", count: 4, note: "до подбородка, фиксация в нижней точке" },
        ],
      },
      {
        match: {
          kind: "custom",
          slug: "custom-lever-one-arm-row",
          name: "Рычажная тяга одной рукой",
          category: "COMPOUND",
          equipment: "machine",
          primaryMuscles: ["middle back"],
          secondaryMuscles: ["lats", "biceps"],
        },
        tip: "В лямках. Полная амплитуда — от полного вытяжения до максимального прожатия.",
        sets: [
          { type: "WARMUP", reps: "15", count: 1 },
          { type: "WORKING", reps: "12", count: 4, note: "с прожатием в пике" },
        ],
      },
      {
        match: lib("bent-over-barbell-row"),
        tip: "Корпус 45°, тянешь к поясу, фиксируешь на 1 сек",
        sets: [
          { type: "WARMUP", reps: "15", count: 1 },
          { type: "WORKING", reps: "12", count: 3, note: "с фиксацией и прожатием 1 сек" },
        ],
      },
      {
        match: lib("seated-cable-rows"),
        tip: "7 подходов — это твоя спина и объём. Не торопись.",
        sets: [{ type: "WORKING", reps: "12-15", count: 7, note: "высокий объём" }],
      },
      {
        match: lib("cable-rear-delt-fly"),
        tip: "Небольшой вес, максимальный контроль. Пауза 1 сек в прожатии.",
        sets: [
          { type: "WARMUP", reps: "20", count: 1 },
          { type: "WORKING", reps: "15", count: 4, note: "с паузой" },
        ],
      },
      {
        match: lib("bent-over-dumbbell-rear-delt-raise-with-head-on-bench"),
        tip: "Гантели идут строго в сторону, не вперёд",
        sets: [{ type: "WORKING", reps: "12", count: 4 }],
      },
    ],
  },
  {
    dayIndex: 3,
    name: "День 3 — Ноги",
    exercises: [
      {
        match: lib("leg-extensions"),
        tip: "Разогрев — не спеши. Дроп-сет в конце — убийственный",
        sets: [
          { type: "WARMUP", reps: "50", count: 1, note: "очень лёгкий вес" },
          { type: "WORKING", reps: "20", count: 3, note: "средний вес" },
          { type: "DROPSET", reps: "15/15/15", count: 1, note: "дроп-сет финиш" },
        ],
      },
      {
        match: lib("narrow-stance-leg-press"),
        tip: "Добавили 1 подход (6 вместо 5) — ты уже хорошо двигаешь 180 кг",
        sets: [
          { type: "WARMUP", reps: "20", count: 1, note: "100 кг" },
          { type: "WORKING", reps: "12-15", count: 6, note: "колени не выпрямлять, пауза внизу" },
        ],
      },
      {
        match: lib("hack-squat"),
        tip: "Медленный темп, полная амплитуда",
        sets: [
          { type: "WARMUP", reps: "20", count: 1 },
          { type: "WORKING", reps: "12", count: 5, note: "ноги вперёд 90°, Смитт фронтально" },
        ],
      },
      {
        match: lib("lying-leg-curls"),
        tip: "Осторожно с оперированным коленом. Если дискомфорт — пропускай или уменьшай вес",
        sets: [
          { type: "WARMUP", reps: "20", count: 1, note: "маленький вес" },
          { type: "WORKING", reps: "15", count: 4, note: "медленно — особенно больное колено" },
        ],
      },
      {
        match: lib("seated-leg-curl"),
        tip: "Контролируй обе фазы движения",
        sets: [{ type: "WORKING", reps: "15", count: 4 }],
      },
      {
        match: lib("adductor"),
        tip: "Медленно, с паузой в точке сжатия 1-2 сек",
        sets: [{ type: "WORKING", reps: "20-30", count: 5, note: "пауза в сокращении" }],
      },
      {
        match: lib("standing-calf-raises"),
        tip: "Полная амплитуда — максимальный подъём и полный спуск",
        sets: [{ type: "WORKING", reps: "20-30", count: 7, note: "отдых 1 мин", restSeconds: 60 }],
      },
    ],
  },
  {
    dayIndex: 4,
    name: "День 4 — Плечи + Трицепс",
    exercises: [
      {
        match: {
          kind: "custom",
          slug: "custom-hammer-shoulder-press",
          name: "Жим в Хаммере на плечи",
          category: "COMPOUND",
          equipment: "machine",
          primaryMuscles: ["shoulders"],
          secondaryMuscles: ["triceps"],
        },
        tip: "Взрывной жим вверх, контролируемый спуск",
        sets: [
          { type: "WARMUP", reps: "20", count: 1 },
          { type: "WORKING", reps: "12", count: 5, note: "добавили подход" },
        ],
      },
      {
        match: lib("side-lateral-raise"),
        tip: "Локоть ведущий — не кисть. Лёгкое сгибание локтя.",
        sets: [
          { type: "WARMUP", reps: "20", count: 1 },
          { type: "WORKING", reps: "15", count: 6, note: "добавили подход" },
        ],
      },
      {
        match: {
          kind: "custom",
          slug: "custom-cable-rear-lateral-single-arm",
          name: "Махи в кроссовере из-за спины (одна рука)",
          category: "ISOLATION",
          equipment: "cable",
          primaryMuscles: ["shoulders"],
          secondaryMuscles: [],
        },
        tip: "7 подходов — изоляция задней дельты высокого объёма",
        sets: [{ type: "WORKING", reps: "12-15", count: 7 }],
      },
      {
        match: lib("close-grip-front-lat-pulldown"),
        tip: "Лёгкая спина между тяжёлыми плечами",
        sets: [
          { type: "WARMUP", reps: "15", count: 1 },
          { type: "WORKING", reps: "12", count: 4 },
        ],
      },
      {
        match: lib("pullups"),
        tip: "Второй раз за неделю — объём нарабатывается. Можно с ассистором.",
        sets: [{ type: "WORKING", reps: "max", count: 4 }],
      },
      {
        match: lib("cable-rope-overhead-triceps-extension"),
        tip: "Суперсет без отдыха между упражнениями",
        supersetGroup: 1,
        sets: [
          { type: "WARMUP", reps: "20", count: 1 },
          { type: "WORKING", reps: "12", count: 5, note: "сразу переходи ко второму упражнению" },
        ],
      },
      {
        match: lib("reverse-grip-triceps-pushdown"),
        tip: "Полное разгибание в локте. Пауза в выпрямленном положении.",
        supersetGroup: 1,
        sets: [
          { type: "WARMUP", reps: "20", count: 1 },
          { type: "WORKING", reps: "15-20", count: 5, note: "парно с французским жимом" },
        ],
      },
    ],
  },
  {
    dayIndex: 5,
    name: "День 5 — Бицепс + Трицепс + Пресс",
    exercises: [
      {
        match: lib("barbell-curl"),
        tip: "Локти строго у тела, не качайся корпусом",
        sets: [
          { type: "WARMUP", reps: "20", count: 1 },
          { type: "WARMUP", reps: "15", count: 1 },
          { type: "WORKING", reps: "10", count: 4, note: "тяжело, медленно" },
        ],
      },
      {
        match: lib("dumbbell-alternate-bicep-curl"),
        tip: "Супинация кисти в верхней точке",
        sets: [{ type: "WORKING", reps: "12", count: 4, note: "можно стоя или сидя" }],
      },
      {
        match: lib("standing-biceps-cable-curl"),
        tip: "7 подходов — пиковое сокращение. Пауза наверху.",
        sets: [{ type: "WORKING", reps: "12-15", count: 7, note: "высокий объём" }],
      },
      {
        match: lib("dips---triceps-version"),
        tip: "Корпус прямо (не наклоняйся вперёд — это уже грудь). Полное разгибание вверху.",
        sets: [{ type: "WORKING", reps: "max", count: 4, note: "корпус вертикально — акцент трицепс" }],
      },
      {
        match: lib("close-grip-barbell-bench-press"),
        tip: "Хват чуть уже плеч, локти смотрят вперёд",
        sets: [
          { type: "WARMUP", reps: "20", count: 1 },
          { type: "WORKING", reps: "12", count: 4 },
        ],
      },
      {
        match: lib("triceps-pushdown---rope-attachment"),
        tip: "В нижней точке разводи концы каната — двойное прожатие",
        sets: [{ type: "WORKING", reps: "12-15", count: 7, note: "финиш объёмный" }],
      },
      {
        match: lib("crunches"),
        sets: [{ type: "WORKING", reps: "20-25", count: 3 }],
      },
      {
        match: lib("plank"),
        tip: "Пресс в конце дня рук — идеально, мышцы уже разогреты",
        sets: [{ type: "WORKING", reps: "60 сек", count: 3 }],
      },
    ],
  },
];

function defaultRest(type: SetType, category: ExerciseCategory): number {
  if (type === "WARMUP") return 45;
  if (type === "DROPSET") return 90;
  return category === "ISOLATION" ? 60 : 90;
}

async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });

  const user = await prisma.user.upsert({
    where: { email: USER_EMAIL },
    create: { email: USER_EMAIL },
    update: {},
  });

  await prisma.profile.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      heightCm: 181,
      weightKg: 106.1,
      experienceLevel: "intermediate",
      goalType: "HYPERTROPHY",
      goalText: "Набор массы, приоритет грудь, высокий объём для сжигания калорий",
      constraints: "Осторожно с коленом: одностороннее сгибание ног выполнять медленно, при дискомфорте — пропускать или снижать вес",
    },
    update: {},
  });

  await prisma.bodyMeasurement.create({
    data: {
      userId: user.id,
      date: new Date("2026-01-09"),
      weightKg: 106.1,
      chestCm: 116,
      waistCm: 96,
      abdomenCm: 100,
      hipsCm: 109,
      thighRightCm: 69,
      thighLeftCm: 69,
      bicepRightCm: 40.5,
      bicepLeftCm: 41.5,
      calfRightCm: 43.5,
      calfLeftCm: 43,
      notes: "Стартовые замеры перед новой программой",
    },
  });

  const plan = await prisma.workoutPlan.create({
    data: {
      userId: user.id,
      name: "Программа 2026 — Масса + Объём (v3)",
      goalType: "HYPERTROPHY",
      goalText: "Набор массы, приоритет грудь, высокий объём для сжигания калорий",
      isActive: true,
    },
  });

  const customExerciseCache = new Map<string, string>(); // slug -> id

  for (const day of PLAN) {
    const planDay = await prisma.planDay.create({
      data: { planId: plan.id, dayIndex: day.dayIndex, name: day.name },
    });

    for (let i = 0; i < day.exercises.length; i++) {
      const spec = day.exercises[i];
      let exerciseId: string;
      let category: ExerciseCategory;

      if (spec.match.kind === "library") {
        const exercise = await prisma.exercise.findUnique({ where: { slug: spec.match.slug } });
        if (!exercise) throw new Error(`Library exercise not found: ${spec.match.slug}`);
        exerciseId = exercise.id;
        category = exercise.category;
      } else {
        const def = spec.match;
        category = def.category;
        if (customExerciseCache.has(def.slug)) {
          exerciseId = customExerciseCache.get(def.slug)!;
        } else {
          const created = await prisma.exercise.upsert({
            where: { slug: def.slug },
            create: {
              slug: def.slug,
              name: def.name,
              category: def.category,
              equipment: def.equipment,
              primaryMuscles: def.primaryMuscles,
              secondaryMuscles: def.secondaryMuscles,
              userId: user.id,
              isCustom: true,
            },
            update: {},
          });
          exerciseId = created.id;
          customExerciseCache.set(def.slug, created.id);
        }
      }

      const planDayExercise = await prisma.planDayExercise.create({
        data: {
          planDayId: planDay.id,
          exerciseId,
          orderIndex: i,
          supersetGroup: spec.supersetGroup,
          note: spec.tip,
        },
      });

      let setIndex = 1;
      for (const setSpec of spec.sets) {
        for (let c = 0; c < setSpec.count; c++) {
          await prisma.planSet.create({
            data: {
              planDayExerciseId: planDayExercise.id,
              setIndex: setIndex++,
              type: setSpec.type,
              targetReps: setSpec.reps,
              restSeconds: setSpec.restSeconds ?? defaultRest(setSpec.type, category),
              note: setSpec.note,
            },
          });
        }
      }
    }
  }

  console.log(`Imported plan "${plan.name}" (${plan.id}) for ${USER_EMAIL} with ${PLAN.length} days.`);
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
