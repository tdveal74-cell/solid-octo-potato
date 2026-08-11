import { describe, expect, it } from "vitest";
import {
  classifyTask,
  exposureBand,
  JSA_METHODOLOGY_VERSION,
  runAudit,
  scoreTask,
  sensitivityPreview,
  type TaskInput,
} from "@/lib/career/audit";

const FULLY_AUTOMATABLE: TaskInput["factors"] = {
  routineness: 10,
  digitalness: 10,
  creativity: 0,
  interpersonal: 0,
  physical: 0,
};

const FULLY_PROTECTED: TaskInput["factors"] = {
  routineness: 0,
  digitalness: 0,
  creativity: 10,
  interpersonal: 10,
  physical: 10,
};

describe("scoreTask", () => {
  it("scores a fully automatable task at 100", () => {
    expect(scoreTask(FULLY_AUTOMATABLE)).toBe(100);
  });

  it("scores a fully protected task at 0", () => {
    expect(scoreTask(FULLY_PROTECTED)).toBe(0);
  });

  it("is monotonic in routineness", () => {
    const base = { ...FULLY_PROTECTED };
    const scores = [0, 5, 10].map((r) => scoreTask({ ...base, routineness: r }));
    expect(scores[0]).toBeLessThan(scores[1]);
    expect(scores[1]).toBeLessThan(scores[2]);
  });

  it("creativity reduces exposure", () => {
    const creative = scoreTask({ ...FULLY_AUTOMATABLE, creativity: 10 });
    expect(creative).toBeLessThan(scoreTask(FULLY_AUTOMATABLE));
  });

  it("clamps out-of-range factor values", () => {
    const score = scoreTask({
      routineness: 99,
      digitalness: -5,
      creativity: NaN,
      interpersonal: 0,
      physical: 0,
    });
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });
});

describe("classifyTask / exposureBand", () => {
  it("classifies at documented thresholds", () => {
    expect(classifyTask(85)).toBe("automate");
    expect(classifyTask(55)).toBe("augment");
    expect(classifyTask(20)).toBe("human-leverage");
  });

  it("bands at documented thresholds", () => {
    expect(exposureBand(80)).toBe("high");
    expect(exposureBand(60)).toBe("elevated");
    expect(exposureBand(40)).toBe("moderate");
    expect(exposureBand(10)).toBe("low");
  });
});

describe("runAudit", () => {
  const tasks: TaskInput[] = [
    { name: "Data entry", timeShare: 40, factors: FULLY_AUTOMATABLE },
    { name: "Client negotiation", timeShare: 40, factors: FULLY_PROTECTED },
    {
      name: "Report drafting",
      timeShare: 20,
      factors: { routineness: 7, digitalness: 9, creativity: 3, interpersonal: 2, physical: 0 },
    },
  ];

  it("stamps methodology version on every result", () => {
    const result = runAudit(tasks);
    expect(result.methodologyVersion).toBe(JSA_METHODOLOGY_VERSION);
    expect(result.uncertainty.scoreIsDeterministic).toBe(true);
  });

  it("computes a time-weighted exposure score", () => {
    const result = runAudit(tasks);
    const reportScore = result.tasks.find((t) => t.name === "Report drafting")!.exposure;
    const expected = Math.round((0.4 * 100 + 0.4 * 0 + 0.2 * reportScore) * 10) / 10;
    expect(result.exposureScore).toBeCloseTo(expected, 1);
    expect(result.securityScore).toBeCloseTo(100 - expected, 1);
  });

  it("normalizes time shares that do not sum to 100", () => {
    const doubled = tasks.map((t) => ({ ...t, timeShare: t.timeShare * 2 }));
    expect(runAudit(doubled).exposureScore).toBeCloseTo(runAudit(tasks).exposureScore, 5);
  });

  it("identifies human-leverage and automation-front tasks", () => {
    const result = runAudit(tasks);
    expect(result.humanLeverage[0]).toBe("Client negotiation");
    expect(result.automationFront[0]).toBe("Data entry");
  });

  it("never recommends an automate-band task as human leverage", () => {
    const allAutomatable = runAudit([
      { name: "Data entry", timeShare: 60, factors: FULLY_AUTOMATABLE },
      { name: "Invoice matching", timeShare: 40, factors: { ...FULLY_AUTOMATABLE, creativity: 1 } },
    ]);
    expect(allAutomatable.humanLeverage).toEqual([]);
    expect(allAutomatable.automationFront.length).toBeGreaterThan(0);
  });

  it("never lists the same task in both headline lists", () => {
    const two = runAudit(tasks.slice(0, 2));
    const overlap = two.humanLeverage.filter((t) => two.automationFront.includes(t));
    expect(overlap).toHaveLength(0);
  });

  it("rejects an empty task list", () => {
    expect(() => runAudit([])).toThrow();
  });

  it("rejects zero total time", () => {
    expect(() =>
      runAudit([{ name: "x", timeShare: 0, factors: FULLY_AUTOMATABLE }])
    ).toThrow();
  });
});

describe("sensitivityPreview", () => {
  it("shows direction of factor change", () => {
    const s = sensitivityPreview(FULLY_PROTECTED, "routineness", 5);
    expect(s.adjusted).toBeGreaterThan(s.base);
  });
});
