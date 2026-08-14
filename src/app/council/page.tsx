"use client";

import { useState } from "react";
import type { DeliberationResult } from "@/lib/council/types";
import {
  Badge,
  Button,
  Card,
  CardTitle,
  Grid,
  Heading,
  Lede,
  Page,
  Stat,
} from "@/components/ui/primitives";

const STANCE_COLOR: Record<string, string> = {
  endorse: "text-signal-green",
  endorse_with_conditions: "text-signal-amber",
  oppose: "text-signal-red",
  abstain: "text-fog-dim",
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
    <Page className="max-w-4xl py-16">
      <Heading level={1} size="lg">
        Convene the Council
      </Heading>
      <Lede className="mt-3">
        Put a real decision in front of eight seats. They analyze independently, debate if you ask,
        and return a scored recommendation with dissent preserved. You remain the decision-maker.
      </Lede>

      <form onSubmit={submit} className="mt-10 space-y-4">
        <label htmlFor="council-question" className="block text-sm text-fog">
          Decision for the Council
        </label>
        <textarea
          id="council-question"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          rows={4}
          placeholder="e.g. Should we launch the enterprise tier before the beta program closes, or wait for SOC 2 Type I?"
          className="w-full rounded-sm border border-ink-border bg-ink-raised p-4 text-sm text-fog placeholder:text-fog-dim focus:border-brass focus:outline-none"
        />
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <label className="flex items-center gap-2 text-sm text-fog-dim">
            <input
              type="checkbox"
              checked={debate}
              onChange={(e) => setDebate(e.target.checked)}
              className="accent-brass"
            />
            Include debate round (phase 2)
          </label>
          <Button type="submit" disabled={loading || question.trim().length < 8} className="py-2.5">
            {loading ? "Deliberating…" : "Deliberate"}
          </Button>
        </div>
      </form>

      {!result && !loading && !error && (
        <div className="mt-10 rounded-sm border border-dashed border-ink-border bg-ink-raised/40 p-6">
          <p className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-widest text-fog-dim">
            What you get back
          </p>
          <ul className="mt-3 space-y-2 text-sm text-fog-dim">
            <li>Recommendation — decision + summary + rationale</li>
            <li>Conditions — what must hold before execution</li>
            <li>Dissent — minority seats on the record</li>
            <li>Seat verdicts — stance, confidence, risks</li>
            <li>Consensus score, aggregate risk, contradictions</li>
          </ul>
          <p className="mt-4 text-xs text-fog-dim">
            Without an API key the path runs in degraded mode: deterministic readiness checks, not a
            live AI verdict — and it says so.
          </p>
        </div>
      )}

      {result?.execution?.mode === "degraded" && (
        <div
          role="status"
          className="mt-8 rounded-sm border border-signal-amber/50 bg-signal-amber/10 p-4"
        >
          <p className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-widest text-signal-amber">
            Provider-degraded mode
          </p>
          <p className="mt-2 text-sm leading-relaxed text-fog">{result.execution.notice}</p>
          <p className="mt-2 text-xs leading-relaxed text-fog-dim">
            These are deterministic readiness checks, not a live AI verdict. Full Council
            deliberation resumes when the Anthropic account can serve requests.
          </p>
        </div>
      )}

      {loading && (
        <p
          role="status"
          className="mt-8 animate-pulse font-[family-name:var(--font-mono)] text-xs uppercase tracking-widest text-brass"
        >
          Eight councils in session — this can take a few minutes…
        </p>
      )}
      {error && (
        <p role="alert" className="mt-8 text-sm text-signal-red">
          {error}
        </p>
      )}

      {result && (
        <div className="mt-12 space-y-8">
          <div className="rounded-sm border border-brass-dim bg-ink-raised p-6">
            <p className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-widest text-brass">
              Decision package · Supreme Orchestrator —{" "}
              {result.recommendation.decision.replaceAll("_", " ")}
            </p>
            <h2 className="mt-2 text-lg font-semibold text-fog">{result.recommendation.summary}</h2>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-fog-dim">
              {result.recommendation.rationale}
            </p>
            {result.recommendation.conditions.length > 0 && (
              <div className="mt-4">
                <p className="text-xs uppercase tracking-widest text-fog-dim">Conditions</p>
                <ul className="mt-2 space-y-1 text-sm text-signal-amber">
                  {result.recommendation.conditions.map((c, i) => (
                    <li key={i}>▸ {c}</li>
                  ))}
                </ul>
              </div>
            )}
            {result.recommendation.dissent.length > 0 && (
              <div className="mt-4 border-t border-ink-border pt-4">
                <p className="text-xs uppercase tracking-widest text-fog-dim">Dissent on record</p>
                <ul className="mt-2 space-y-1 text-sm text-fog-dim">
                  {result.recommendation.dissent.map((d, i) => (
                    <li key={i}>— {d}</li>
                  ))}
                </ul>
              </div>
            )}
            <p className="mt-5 border-t border-ink-border pt-4 text-xs text-fog-dim">
              Next step is yours. Accept, refuse, or reframe the question and run again. The Council
              advises; it does not act.
            </p>
          </div>

          <Grid cols={3}>
            <Stat
              label="Support"
              value={result.consensus.score}
              tone={
                result.consensus.score >= 70
                  ? "good"
                  : result.consensus.score >= 40
                    ? "warn"
                    : "bad"
              }
            />
            <Stat
              label="Aggregate risk"
              value={result.consensus.aggregateRisk.score}
              tone={riskTone(result.consensus.aggregateRisk.highestSeverity)}
            />
            <Stat
              label="Contradictions"
              value={result.consensus.contradictions.length}
              tone={result.consensus.contradictions.length > 0 ? "warn" : "neutral"}
            />
          </Grid>
          <p className="-mt-4 text-xs text-fog-dim">
            {result.consensus.band} agreement ({result.consensus.agreement}) ·{" "}
            {result.consensus.aggregateRisk.highestSeverity ?? "no"} severity ·{" "}
            {(result.elapsedMs / 1000).toFixed(0)}s deliberation
          </p>

          <Grid cols={2}>
            {verdicts.map((v) => (
              <Card key={v.councilId}>
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="capitalize">{v.councilId} council</CardTitle>
                  <span
                    className={`font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-widest ${STANCE_COLOR[v.stance]}`}
                  >
                    {v.stance.replaceAll("_", " ")} · {(v.confidence * 100).toFixed(0)}%
                  </span>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-fog-dim">{v.position}</p>
                {v.risks.length > 0 && (
                  <ul className="mt-3 space-y-1.5 text-[11px] text-signal-amber">
                    {v.risks.map((r, i) => (
                      <li key={i} className="flex gap-2">
                        <Badge tone={riskTone(r.severity)}>{r.severity}</Badge>
                        <span className="text-fog-dim">{r.description}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            ))}
          </Grid>
        </div>
      )}
    </Page>
  );
}

function riskTone(severity?: string | null): "neutral" | "warn" | "bad" {
  const s = (severity ?? "").toLowerCase();
  if (["critical", "high", "severe"].includes(s)) return "bad";
  if (["medium", "moderate", "low"].includes(s)) return "warn";
  return "neutral";
}
