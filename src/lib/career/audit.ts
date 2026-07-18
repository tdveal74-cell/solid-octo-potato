/**
 * Job Security Audit — deterministic AI-exposure scoring engine.
 *
 * The audit reasons task-by-task, not title-by-title. A role is a weighted
 * portfolio of tasks; each task is rated on five automatability factors, and
 * the role's exposure is the time-weighted aggregate. The LLM layer (Job
 * Security Audit Agent) adds the qualitative narrative on top of these
 * numbers — the numbers themselves are pure and reproducible.
 */

export interface TaskInput {
  name: string;
  /** Share of working time spent on this task, 0–100. Normalized internally. */
  timeShare: number;
  /** Each factor 0–10. */
  factors: TaskFactors;
}

export interface TaskFactors {
  /** How rule-based / repeatable the task is (10 = fully proceduralized). */
  routineness: number;
  /** How much the task is pure information manipulation (10 = entirely digital I/O). */
  digitalness: number;
  /** Genuine creative/novel judgment required (10 = constant novel judgment). REDUCES exposure. */
  creativity: number;
  /** Trust, empathy, persuasion, accountability to humans (10 = relationship-critical). REDUCES exposure. */
  interpersonal: number;
  /** Physical presence / dexterity required (10 = fully physical). REDUCES exposure. */
  physical: number;
}

export interface TaskScore {
  name: string;
  timeShare: number;
  /** 0–100 exposure for this task. */
  exposure: number;
  classification: "automate" | "augment" | "human-leverage";
}

export interface AuditResult {
  /** 0–100 overall AI exposure (higher = more exposed). */
  exposureScore: number;
  /** 0–100 security score (inverse convenience view). */
  securityScore: number;
  band: "low" | "moderate" | "elevated" | "high";
  tasks: TaskScore[];
  /** Tasks to deliberately concentrate time on (lowest exposure, highest leverage). */
  humanLeverage: string[];
  /** Tasks likely to be automated first (highest exposure). */
  automationFront: string[];
}

const FACTOR_WEIGHTS = {
  routineness: 0.35,
  digitalness: 0.25,
  creativity: -0.15,
  interpersonal: -0.15,
  physical: -0.1,
} as const;

/** Score a single task's AI exposure, 0–100. */
export function scoreTask(factors: TaskFactors): number {
  // Weighted sum over factors normalized to 0–1; negative weights are
  // protective. Raw range is [-0.4, 0.6]; map linearly to [0, 100].
  const f = normalizeFactors(factors);
  const raw =
    f.routineness * FACTOR_WEIGHTS.routineness +
    f.digitalness * FACTOR_WEIGHTS.digitalness +
    f.creativity * FACTOR_WEIGHTS.creativity +
    f.interpersonal * FACTOR_WEIGHTS.interpersonal +
    f.physical * FACTOR_WEIGHTS.physical;
  const min = FACTOR_WEIGHTS.creativity + FACTOR_WEIGHTS.interpersonal + FACTOR_WEIGHTS.physical; // -0.4
  const max = FACTOR_WEIGHTS.routineness + FACTOR_WEIGHTS.digitalness; // 0.6
  return round1(((raw - min) / (max - min)) * 100);
}

export function classifyTask(exposure: number): TaskScore["classification"] {
  if (exposure >= 70) return "automate";
  if (exposure >= 40) return "augment";
  return "human-leverage";
}

export function exposureBand(score: number): AuditResult["band"] {
  if (score >= 70) return "high";
  if (score >= 55) return "elevated";
  if (score >= 35) return "moderate";
  return "low";
}

export function runAudit(tasks: TaskInput[]): AuditResult {
  if (tasks.length === 0) {
    throw new Error("Audit requires at least one task");
  }
  const totalTime = tasks.reduce((s, t) => s + Math.max(0, t.timeShare), 0);
  if (totalTime <= 0) {
    throw new Error("Task time shares must sum to a positive number");
  }

  const scored: TaskScore[] = tasks.map((t) => {
    const exposure = scoreTask(t.factors);
    return {
      name: t.name,
      timeShare: round1((Math.max(0, t.timeShare) / totalTime) * 100),
      exposure,
      classification: classifyTask(exposure),
    };
  });

  const exposureScore = round1(
    scored.reduce((s, t) => s + t.exposure * (t.timeShare / 100), 0)
  );

  // Split the safety-sorted list so the two headline lists never overlap,
  // even for roles decomposed into only two or three tasks.
  const bySafety = [...scored].sort((a, b) => a.exposure - b.exposure);
  const leverageCount = Math.min(3, Math.ceil(bySafety.length / 2));
  const frontCount = Math.min(3, bySafety.length - leverageCount);
  return {
    exposureScore,
    securityScore: round1(100 - exposureScore),
    band: exposureBand(exposureScore),
    tasks: scored,
    humanLeverage: bySafety.slice(0, leverageCount).map((t) => t.name),
    automationFront: bySafety
      .slice(bySafety.length - frontCount)
      .reverse()
      .map((t) => t.name),
  };
}

function normalizeFactors(f: TaskFactors): TaskFactors {
  const clamp = (n: number) => Math.min(10, Math.max(0, Number.isFinite(n) ? n : 0)) / 10;
  return {
    routineness: clamp(f.routineness),
    digitalness: clamp(f.digitalness),
    creativity: clamp(f.creativity),
    interpersonal: clamp(f.interpersonal),
    physical: clamp(f.physical),
  };
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}
