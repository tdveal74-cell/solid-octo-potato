"use client";

import { useState } from "react";
import type { DeliberationResult } from "@/lib/council/types";
import {
  ArrowList,
  Button,
  Card,
  Checkbox,
  Eyebrow,
  Field,
  Notice,
  SectionHeader,
  Stat,
  TextArea,
} from "@/components";

const STANCE_TONE: Record<string, "green" | "amber" | "red" | "dim"> = {
  endorse: "green",
  endorse_with_conditions: "amber",
  oppose: "red",
  abstain: "dim",
};

export default function CouncilPage() {
  const [question, setQuestion] = useState("");
  const [debate, setDebate] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<DeliberationResult | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/council/deliberate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, debate }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Deliberation failed");
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Deliberation failed");
    } finally {
      setLoading(false);
    }
  }

  const verdicts = result ? (result.phase2 ?? result.phase1) : [];

  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <SectionHeader
        title="Convene the Council"
        description="Put a decision before all eight councils. They analyze independently, debate, and return a scored recommendation with dissent preserved."
      />

      <form onSubmit={submit} className="mt-10 space-y-4">
        <Field label="Decision for the Council" htmlFor="council-question">
          <TextArea
            id="council-question"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            rows={4}
            placeholder="e.g. Should we launch the enterprise tier before the beta program closes, or wait for SOC 2 Type I?"
          />
        </Field>
        <div className="flex items-center justify-between">
          <Checkbox
            checked={debate}
            onChange={(e) => setDebate(e.target.checked)}
            label="Include debate round (phase 2)"
          />
          <Button type="submit" size="sm" disabled={loading || question.trim().length < 8}>
            {loading ? "Deliberating…" : "Deliberate"}
          </Button>
        </div>
      </form>

      {loading && (
        <Notice tone="brass" pulse className="mt-8">
          Eight councils in session — this can take a few minutes…
        </Notice>
      )}
      {error && (
        <Notice tone="red" className="mt-8">
          {error}
        </Notice>
      )}

      {result && (
        <div className="mt-12 space-y-8">
          {/* Recommendation */}
          <Card variant="accent" padding="md">
            <Eyebrow>
              Supreme Orchestrator — {result.recommendation.decision.replaceAll("_", " ")}
            </Eyebrow>
            <h2 className="mt-2 text-lg font-semibold text-fog">
              {result.recommendation.summary}
            </h2>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-fog-dim">
              {result.recommendation.rationale}
            </p>
            {result.recommendation.conditions.length > 0 && (
              <ArrowList
                className="mt-4"
                tone="amber"
                items={result.recommendation.conditions}
              />
            )}
            {result.recommendation.dissent.length > 0 && (
              <div className="mt-4 border-t border-ink-border pt-4">
                <Eyebrow size="sm" mono={false} tone="dim">
                  Dissent on record
                </Eyebrow>
                <ArrowList
                  className="mt-2"
                  marker="dash"
                  tone="dim"
                  items={result.recommendation.dissent}
                />
              </div>
            )}
          </Card>

          {/* Metrics */}
          <div className="grid grid-cols-3 gap-4">
            <Stat
              center
              label="Support"
              value={`${result.consensus.score}`}
              sub={`${result.consensus.band} agreement (${result.consensus.agreement})`}
            />
            <Stat
              center
              label="Aggregate risk"
              value={`${result.consensus.aggregateRisk.score}`}
              sub={result.consensus.aggregateRisk.highestSeverity ?? "none"}
            />
            <Stat
              center
              label="Contradictions"
              value={`${result.consensus.contradictions.length}`}
              sub={`${(result.elapsedMs / 1000).toFixed(0)}s deliberation`}
            />
          </div>

          {/* Verdicts */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {verdicts.map((v) => (
              <Card key={v.councilId}>
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold capitalize text-fog">
                    {v.councilId} council
                  </h3>
                  <Eyebrow as="span" tone={STANCE_TONE[v.stance]}>
                    {v.stance.replaceAll("_", " ")} · {(v.confidence * 100).toFixed(0)}%
                  </Eyebrow>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-fog-dim">{v.position}</p>
                {v.risks.length > 0 && (
                  <ul className="mt-3 space-y-1 text-[11px] text-signal-amber">
                    {v.risks.map((r, i) => (
                      <li key={i}>
                        [{r.severity}] {r.description}
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
