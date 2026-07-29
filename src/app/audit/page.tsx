"use client";

import { useState } from "react";
import type { AuditResult, TaskInput } from "@/lib/career/audit";
import {
  ArrowList,
  Button,
  Card,
  DataTable,
  Eyebrow,
  Field,
  Notice,
  RangeField,
  SectionHeader,
  TextInput,
} from "@/components";

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
    <div className="mx-auto max-w-4xl px-6 py-16">
      <SectionHeader
        title="Job Security Audit"
        description="Your job title doesn't get automated — your tasks do. Break your role into tasks, rate each one, and get a deterministic AI-exposure score with the tasks worth doubling down on."
      />

      <form onSubmit={submit} className="mt-10 space-y-6">
        <Field label="Your role" htmlFor="audit-role">
          <TextInput
            id="audit-role"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            placeholder="e.g. Senior Financial Analyst"
          />
        </Field>

        {tasks.map((task, i) => (
          <Card key={task.key}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <label htmlFor={`task-name-${task.key}`} className="sr-only">
                Task {i + 1} name
              </label>
              <TextInput
                id={`task-name-${task.key}`}
                inputSize="sm"
                value={task.name}
                onChange={(e) => updateTask(task.key, { name: e.target.value })}
                placeholder={`Task ${i + 1}, e.g. "Monthly variance reporting"`}
                className="flex-1"
              />
              <label
                htmlFor={`task-time-${task.key}`}
                className="flex items-center gap-2 text-xs text-fog-dim"
              >
                % of time
                <TextInput
                  id={`task-time-${task.key}`}
                  inputSize="sm"
                  type="number"
                  min={0}
                  max={100}
                  value={task.timeShare}
                  onChange={(e) => updateTask(task.key, { timeShare: Number(e.target.value) })}
                  className="w-16"
                />
              </label>
              {tasks.length > 1 && (
                <Button
                  variant="ghost-danger"
                  onClick={() => setTasks((ts) => ts.filter((t) => t.key !== task.key))}
                >
                  remove
                </Button>
              )}
            </div>
            <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-5">
              {FACTOR_LABELS.map(({ key, label, hint }) => (
                <RangeField
                  key={key}
                  label={label}
                  valueLabel={task.factors[key]}
                  hint={hint}
                  min={0}
                  max={10}
                  value={task.factors[key]}
                  onChange={(e) => updateFactor(task.key, key, Number(e.target.value))}
                />
              ))}
            </div>
          </Card>
        ))}

        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => setTasks((ts) => [...ts, blankTask()])}>
            + Add task
          </Button>
          <Button
            type="submit"
            size="sm"
            disabled={loading || !role.trim() || tasks.some((t) => !t.name.trim())}
          >
            {loading ? "Scoring…" : "Run audit"}
          </Button>
        </div>
      </form>

      {error && (
        <Notice tone="red" className="mt-8">
          {error}
        </Notice>
      )}

      {audit && (
        <div className="mt-12 space-y-6">
          <Card variant="accent" padding="md" className="text-center">
            <Eyebrow tone="dim">AI exposure</Eyebrow>
            <p
              className={`mt-2 font-[family-name:var(--font-display)] text-6xl ${BAND_COLOR[audit.band]}`}
            >
              {audit.exposureScore}
            </p>
            <p className="mt-1 text-sm capitalize text-fog-dim">
              {audit.band} exposure · security score {audit.securityScore}
            </p>
          </Card>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Card>
              <Eyebrow size="sm" mono={false} tone="green">
                Double down here
              </Eyebrow>
              {audit.humanLeverage.length > 0 ? (
                <ArrowList className="mt-3" items={audit.humanLeverage} />
              ) : (
                <Notice tone="dim" className="mt-3">
                  No safe harbor: every task you listed sits in the automate band. The
                  move here is repositioning — adding genuinely human-leverage work to
                  the role — not defending current tasks.
                </Notice>
              )}
            </Card>
            <Card>
              <Eyebrow size="sm" mono={false} tone="red">
                Automation front
              </Eyebrow>
              <ArrowList className="mt-3" items={audit.automationFront} />
            </Card>
          </div>

          <Card>
            <Eyebrow size="sm" mono={false} tone="dim">
              Task breakdown
            </Eyebrow>
            <DataTable
              className="mt-3"
              align={["left", "right", "right", "left"]}
              columns={["Task", "Time", "Exposure", "Classification"]}
              rows={audit.tasks.map((t) => [
                t.name,
                `${t.timeShare}%`,
                t.exposure,
                <span key="c" className="capitalize">
                  {t.classification.replace("-", " ")}
                </span>,
              ])}
            />
          </Card>
        </div>
      )}
    </div>
  );
}
