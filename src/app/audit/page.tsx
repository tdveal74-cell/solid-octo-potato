"use client";

import { useState } from "react";
import type { AuditResult, TaskInput } from "@/lib/career/audit";
import {
  Button,
  Card,
  Heading,
  Input,
  Lede,
  Page,
} from "@/components/ui/primitives";

interface TaskRow extends TaskInput {
  key: number;
}

const FACTOR_LABELS: { key: keyof TaskInput["factors"]; label: string; hint: string }[] = [
  { key: "routineness", label: "Routine", hint: "rule-based / repeatable" },
  { key: "digitalness", label: "Digital", hint: "pure information work" },
  { key: "creativity", label: "Creative", hint: "novel judgment (protective)" },
  { key: "interpersonal", label: "Human", hint: "trust & relationships (protective)" },
  { key: "physical", label: "Physical", hint: "physical presence (protective)" },
];

let nextKey = 1;
function blankTask(): TaskRow {
  return {
    key: nextKey++,
    name: "",
    timeShare: 25,
    factors: { routineness: 5, digitalness: 5, creativity: 5, interpersonal: 5, physical: 2 },
  };
}

const BAND_COLOR: Record<AuditResult["band"], string> = {
  low: "text-signal-green",
  moderate: "text-signal-amber",
  elevated: "text-signal-amber",
  high: "text-signal-red",
};

export default function AuditPage() {
  const [role, setRole] = useState("");
  const [tasks, setTasks] = useState<TaskRow[]>([blankTask(), blankTask()]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [audit, setAudit] = useState<AuditResult | null>(null);

  function updateTask(key: number, patch: Partial<TaskRow>) {
    setTasks((ts) => ts.map((t) => (t.key === key ? { ...t, ...patch } : t)));
  }

  function updateFactor(key: number, factor: keyof TaskInput["factors"], value: number) {
    setTasks((ts) =>
      ts.map((t) => (t.key === key ? { ...t, factors: { ...t.factors, [factor]: value } } : t))
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setAudit(null);
    try {
      const res = await fetch("/api/career/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role,
          tasks: tasks.map(({ key: _key, ...t }) => t),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Audit failed");
      setAudit(data.audit);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Audit failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Page className="max-w-4xl py-16">
      <Heading level={1} size="lg">
        Job Security Audit
      </Heading>
      <Lede className="mt-3">
        Your job title doesn&rsquo;t get automated — your tasks do. Break your role into
        tasks, rate each one, and get a deterministic AI-exposure score with the
        tasks worth doubling down on.
      </Lede>

      <form onSubmit={submit} className="mt-10 space-y-6">
        <div>
          <label htmlFor="audit-role" className="block text-sm text-fog">
            Your role
          </label>
          <Input
            id="audit-role"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            placeholder="e.g. Senior Financial Analyst"
            className="mt-2"
          />
        </div>

        {tasks.map((task, i) => (
          <Card key={task.key}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <label htmlFor={`task-name-${task.key}`} className="sr-only">
                Task {i + 1} name
              </label>
              <Input
                id={`task-name-${task.key}`}
                value={task.name}
                onChange={(e) => updateTask(task.key, { name: e.target.value })}
                placeholder={`Task ${i + 1}, e.g. "Monthly variance reporting"`}
                className="flex-1 p-2.5"
              />
              <label htmlFor={`task-time-${task.key}`} className="flex items-center gap-2 text-xs text-fog-dim">
                % of time
                <Input
                  id={`task-time-${task.key}`}
                  type="number"
                  min={0}
                  max={100}
                  value={task.timeShare}
                  onChange={(e) => updateTask(task.key, { timeShare: Number(e.target.value) })}
                  className="w-16 p-2"
                />
              </label>
              {tasks.length > 1 && (
                <button
                  type="button"
                  onClick={() => setTasks((ts) => ts.filter((t) => t.key !== task.key))}
                  className="text-xs text-fog-dim hover:text-signal-red"
                >
                  remove
                </button>
              )}
            </div>
            <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-5">
              {FACTOR_LABELS.map(({ key, label, hint }) => (
                <label key={key} className="text-xs text-fog-dim">
                  <span className="block text-fog">{label}: {task.factors[key]}</span>
                  <input
                    type="range"
                    min={0}
                    max={10}
                    value={task.factors[key]}
                    onChange={(e) => updateFactor(task.key, key, Number(e.target.value))}
                    className="mt-1 w-full accent-brass"
                  />
                  <span className="mt-1 block text-[10px]">{hint}</span>
                </label>
              ))}
            </div>
          </Card>
        ))}

        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setTasks((ts) => [...ts, blankTask()])}
            className="text-sm text-brass hover:text-fog"
          >
            + Add task
          </button>
          <Button
            type="submit"
            disabled={loading || !role.trim() || tasks.some((t) => !t.name.trim())}
            className="py-2.5"
          >
            {loading ? "Scoring…" : "Run audit"}
          </Button>
        </div>
      </form>

      {error && <p className="mt-8 text-sm text-signal-red">{error}</p>}

      {audit && (
        <div className="mt-12 space-y-6">
          <div className="rounded-sm border border-brass-dim bg-ink-raised p-6 text-center">
            <p className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-widest text-fog-dim">
              AI exposure
            </p>
            <p className={`mt-2 font-[family-name:var(--font-display)] text-6xl ${BAND_COLOR[audit.band]}`}>
              {audit.exposureScore}
            </p>
            <p className="mt-1 text-sm capitalize text-fog-dim">{audit.band} exposure · security score {audit.securityScore}</p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-sm border border-ink-border p-5">
              <p className="text-xs uppercase tracking-widest text-signal-green">Double down here</p>
              {audit.humanLeverage.length > 0 ? (
                <ul className="mt-3 space-y-1 text-sm text-fog">
                  {audit.humanLeverage.map((t, i) => (
                    <li key={`${i}-${t}`}>▸ {t}</li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-sm text-fog-dim">
                  No safe harbor: every task you listed sits in the automate
                  band. The move here is repositioning — adding genuinely
                  human-leverage work to the role — not defending current tasks.
                </p>
              )}
            </div>
            <div className="rounded-sm border border-ink-border p-5">
              <p className="text-xs uppercase tracking-widest text-signal-red">Automation front</p>
              <ul className="mt-3 space-y-1 text-sm text-fog">
                {audit.automationFront.map((t, i) => (
                  <li key={`${i}-${t}`}>▸ {t}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="rounded-sm border border-ink-border p-5">
            <p className="text-xs uppercase tracking-widest text-fog-dim">Task breakdown</p>
            <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[28rem] text-left text-sm">
              <thead className="text-xs text-fog-dim">
                <tr>
                  <th className="py-2 font-normal">Task</th>
                  <th className="py-2 font-normal">Time</th>
                  <th className="py-2 font-normal">Exposure</th>
                  <th className="py-2 font-normal">Classification</th>
                </tr>
              </thead>
              <tbody>
                {audit.tasks.map((t, i) => (
                  <tr key={`${i}-${t.name}`} className="border-t border-ink-border text-fog">
                    <td className="py-2">{t.name}</td>
                    <td className="py-2">{t.timeShare}%</td>
                    <td className="py-2">{t.exposure}</td>
                    <td className="py-2 capitalize">{t.classification.replace("-", " ")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>
        </div>
      )}
    </Page>
  );
}
