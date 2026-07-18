"use client";

import { useState } from "react";
import type { DeliberationResult } from "@/lib/council/types";

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
    <div className="mx-auto max-w-4xl px-6 py-16">
      <h1 className="font-[family-name:var(--font-display)] text-4xl text-fog">
        Convene the Council
      </h1>
      <p className="mt-3 text-fog-dim">
        Put a decision before all eight councils. They analyze independently,
        debate, and return a scored recommendation with dissent preserved.
      </p>

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
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm text-fog-dim">
            <input
              type="checkbox"
              checked={debate}
              onChange={(e) => setDebate(e.target.checked)}
              className="accent-[#c9a96a]"
            />
            Include debate round (phase 2)
          </label>
          <button
            type="submit"
            disabled={loading || question.trim().length < 8}
            className="rounded-sm bg-brass px-6 py-2.5 text-sm font-medium text-ink disabled:opacity-40"
          >
            {loading ? "Deliberating…" : "Deliberate"}
          </button>
        </div>
      </form>

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
          {/* Recommendation */}
          <div className="rounded-sm border border-brass-dim bg-ink-raised p-6">
            <p className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-widest text-brass">
              Supreme Orchestrator — {result.recommendation.decision.replaceAll("_", " ")}
            </p>
            <h2 className="mt-2 text-lg font-semibold text-fog">
              {result.recommendation.summary}
            </h2>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-fog-dim">
              {result.recommendation.rationale}
            </p>
            {result.recommendation.conditions.length > 0 && (
              <ul className="mt-4 space-y-1 text-sm text-signal-amber">
                {result.recommendation.conditions.map((c, i) => (
                  <li key={i}>▸ {c}</li>
                ))}
              </ul>
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
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-3 gap-4">
            <Metric
              label="Support"
              value={`${result.consensus.score}`}
              sub={`${result.consensus.band} agreement (${result.consensus.agreement})`}
            />
            <Metric
              label="Aggregate risk"
              value={`${result.consensus.aggregateRisk.score}`}
              sub={result.consensus.aggregateRisk.highestSeverity ?? "none"}
            />
            <Metric
              label="Contradictions"
              value={`${result.consensus.contradictions.length}`}
              sub={`${(result.elapsedMs / 1000).toFixed(0)}s deliberation`}
            />
          </div>

          {/* Verdicts */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {verdicts.map((v) => (
              <div key={v.councilId} className="rounded-sm border border-ink-border p-5">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold capitalize text-fog">
                    {v.councilId} council
                  </h3>
                  <span
                    className={`font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-widest ${STANCE_COLOR[v.stance]}`}
                  >
                    {v.stance.replaceAll("_", " ")} · {(v.confidence * 100).toFixed(0)}%
                  </span>
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
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Metric({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-sm border border-ink-border bg-ink-raised p-5 text-center">
      <p className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-widest text-fog-dim">
        {label}
      </p>
      <p className="mt-2 font-[family-name:var(--font-display)] text-3xl text-brass">{value}</p>
      <p className="mt-1 text-xs capitalize text-fog-dim">{sub}</p>
    </div>
  );
}
