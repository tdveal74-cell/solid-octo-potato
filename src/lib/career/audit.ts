/**
 * Job Security Audit — deterministic AI-exposure scoring engine.
 *
 * Methodology version is part of the public contract. Scores are only
 * comparable within the same methodologyVersion. Narrative/roadmap layers
 * must never mutate these numbers.
 */

/** Bump when factor weights, banding, or classification thresholds change. */
export const JSA_METHODOLOGY_VERSION = "1.0.0" as const;

export const JSA_METHODOLOGY = {
  version: JSA_METHODOLOGY_VERSION,
  description:
    "Task-level time-weighted exposure from five factors. Deterministic; no model in the score path.",
  factors: [
    { id: "routineness", direction: "increases-exposure", weight: 0.35 },
    { id: "digitalness", direction: "increases-exposure", weight: 0.25 },
    { id: "creativity", direction: "decreases-exposure", weight: -0.15 },
    { id: "interpersonal", direction: "decreases-exposure", weight: -0.15 },
    { id: "physical", direction: "decreases-exposure", weight: -0.1 },
  ],
  classificationThresholds: { automate: 70, augment: 40 },
  bandThresholds: { high: 70, elevated: 55, moderate: 35 },
  uncertaintyNote:
    "Scores are model-free estimates from operator-provided factor ratings. They are decision aids, not predictions. Sensitivity: changing any single factor by ±2 typically moves task exposure by a few points; role score moves with time weight.",
} as const;

export interface TaskInput {
  name: string;
  /** Share of working time spent on this task, 0–100. Normalized internally. */
  timeShare: number;
  /** Each factor 0–10. */
  factors: TaskFactors;
}

export interface TaskFactors {
  routineness: number;
  digitalness: number;
  creativity: number;
  interpersonal: number;
  physical: number;
}

export interface TaskScore {
  name: string;
  timeShare: number;
  exposure: number;
  classification: "automate" | "augment" | "human-leverage";
}

export interface AuditResult {
  methodologyVersion: typeof JSA_METHODOLOGY_VERSION;
  exposureScore: number;
  securityScore: number;
  band: "low" | "moderate" | "elevated" | "high";
  tasks: TaskScore[];
  humanLeverage: string[];
  automationFront: string[];
  /** Qualitative uncertainty for UI — not a calibrated probability. */
  uncertainty: {
    note: string;
    scoreIsDeterministic: true;
    inputsAreSubjective: true;
  };
}

const FACTOR_WEIGHTS = {
  routineness: 0.35,
  digitalness: 0.25,
  creativity: -0.15,
  interpersonal: -0.15,
  physical: -0.1,
} as const;

export function scoreTask(factors: TaskFactors): number {
  const f = normalizeFactors(factors);
  const raw =
    f.routineness * FACTOR_WEIGHTS.routineness +
    f.digitalness * FACTOR_WEIGHTS.digitalness +
    f.creativity * FACTOR_WEIGHTS.creativity +
    f.interpersonal * FACTOR_WEIGHTS.interpersonal +
    f.physical * FACTOR_WEIGHTS.physical;
  const min = FACTOR_WEIGHTS.creativity + FACTOR_WEIGHTS.interpersonal + FACTOR_WEIGHTS.physical;
  const max = FACTOR_WEIGHTS.routineness + FACTOR_WEIGHTS.digitalness;
  return round1(((raw - min) / (max - min)) * 100);
}

export function classifyTask(exposure: number): TaskScore["classification"] {
  if (exposure >= JSA_METHODOLOGY.classificationThresholds.automate) return "automate";
  if (exposure >= JSA_METHODOLOGY.classificationThresholds.augment) return "augment";
  return "human-leverage";
}

export function exposureBand(score: number): AuditResult["band"] {
  if (score >= JSA_METHODOLOGY.bandThresholds.high) return "high";
  if (score >= JSA_METHODOLOGY.bandThresholds.elevated) return "elevated";
  if (score >= JSA_METHODOLOGY.bandThresholds.moderate) return "moderate";
  return "low";
}

/** One-factor sensitivity helper for explainability UI. */
export function sensitivityPreview(
  factors: TaskFactors,
  factor: keyof TaskFactors,
  delta: number
): { base: number; adjusted: number; delta: number } {
  const base = scoreTask(factors);
  const adjusted = scoreTask({ ...factors, [factor]: factors[factor] + delta });
  return { base, adjusted, delta: round1(adjusted - base) };
}

export function runAudit(tasks: TaskInput[]): AuditResult {
  if (tasks.length === 0) {
    throw new Error("Audit requires at least one task");
  }
  if (
    tasks.some(
      (t) => !Number.isFinite(t.timeShare) || t.timeShare < 0 || t.timeShare > 100
    )
  ) {
    throw new Error("Task time shares must be finite values between 0 and 100");
  }
  const totalTime = tasks.reduce((s, t) => s + t.timeShare, 0);
  if (totalTime <= 0) {
    throw new Error("Task time shares must sum to a positive number");
  }

  const scored: TaskScore[] = tasks.map((t) => {
    const exposure = scoreTask(t.factors);
    return {
      name: t.name,
      timeShare: round1((t.timeShare / totalTime) * 100),
      exposure,
      classification: classifyTask(exposure),
    };
  });

  const exposureScore = round1(
    scored.reduce((s, t) => s + t.exposure * (t.timeShare / 100), 0)
  );

  const bySafety = [...scored].sort((a, b) => a.exposure - b.exposure);
  const leverageEligible = bySafety.filter((t) => t.classification !== "automate");
  const leverageCount = Math.min(3, Math.ceil(bySafety.length / 2), leverageEligible.length);
  const humanLeverage = leverageEligible.slice(0, leverageCount).map((t) => t.name);
  const frontPool = bySafety.filter((t) => !humanLeverage.includes(t.name));
  const automationFront = frontPool
    .slice(Math.max(0, frontPool.length - 3))
    .reverse()
    .map((t) => t.name);

  return {
    methodologyVersion: JSA_METHODOLOGY_VERSION,
    exposureScore,
    securityScore: round1(100 - exposureScore),
    band: exposureBand(exposureScore),
    tasks: scored,
    humanLeverage,
    automationFront,
    uncertainty: {
      note: JSA_METHODOLOGY.uncertaintyNote,
      scoreIsDeterministic: true,
      inputsAreSubjective: true,
    },
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
