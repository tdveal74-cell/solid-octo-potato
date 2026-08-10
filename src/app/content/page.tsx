import Link from "next/link";
import {
  PIPELINE_STAGES,
  DEFAULT_AUDIT_LANDING_URL,
  BRANDS,
  N8N_WORKFLOW,
  PIPELINE_TRIGGERS,
} from "@/lib/content/pipeline";

export default function ContentPipelinePage() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-16">
      <p className="font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.3em] text-brass">
        Content Operating System
      </p>
      <h1 className="mt-4 font-[family-name:var(--font-display)] text-4xl text-fog">
        TQO FINAL V5 Pipeline
      </h1>
      <p className="mt-4 max-w-2xl text-fog-dim">
        Dual-brand production engine. Rendering stays in n8n; this board is the
        in-app contract for status, brands, and human checkpoints so the
        platform and automation never drift.
      </p>

      <div className="mt-6 flex flex-wrap gap-3 font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-widest">
        <span className="rounded-sm border border-signal-green px-3 py-1.5 text-signal-green">
          {N8N_WORKFLOW.nodes} nodes · active
        </span>
        <span className="rounded-sm border border-ink-border px-3 py-1.5 text-fog-dim">
          {N8N_WORKFLOW.id}
        </span>
      </div>

      <section className="mt-12">
        <h2 className="text-xs uppercase tracking-widest text-fog-dim">Brands</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {Object.values(BRANDS).map((b) => (
            <div
              key={b.id}
              className="rounded-sm border border-ink-border bg-ink-raised p-5"
            >
              <p className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-widest text-brass">
                {b.show}
              </p>
              <h3 className="mt-2 text-lg font-semibold text-fog">{b.channel}</h3>
              <p className="mt-2 text-sm text-fog-dim">{b.tagline}</p>
              <p className="mt-3 font-[family-name:var(--font-mono)] text-[10px] text-fog-dim">
                table {b.tableId}
              </p>
            </div>
          ))}
        </div>
      </section>

      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {PIPELINE_STAGES.map((stage, i) => (
          <div
            key={stage.status}
            className="rounded-sm border border-ink-border bg-ink-raised p-5"
          >
            <p className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-widest text-brass">
              Stage {i + 1}
            </p>
            <h2 className="mt-2 text-lg font-semibold text-fog">{stage.label}</h2>
            <p className="mt-2 text-xs text-fog-dim">{stage.owner}</p>
            {stage.status === "Ready" && (
              <p className="mt-3 text-xs text-brass">
                Human Review required before Published. Never auto-ticked.
              </p>
            )}
          </div>
        ))}
      </div>

      <section className="mt-16 border-t border-ink-border pt-12">
        <h2 className="font-[family-name:var(--font-display)] text-2xl text-fog">
          Schedules
        </h2>
        <ul className="mt-4 space-y-2 text-sm text-fog-dim">
          {PIPELINE_TRIGGERS.schedules.map((s) => (
            <li key={s.name}>
              <span className="text-fog">{s.name}</span>
              <span className="ml-2 font-[family-name:var(--font-mono)] text-[10px] text-brass">
                {s.cron} · {s.brand}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-12 border-t border-ink-border pt-12">
        <h2 className="font-[family-name:var(--font-display)] text-2xl text-fog">
          Live automation
        </h2>
        <ul className="mt-4 space-y-2 text-sm text-fog-dim">
          <li>TQO FINAL V5 — script, promote, render, publish, brief, analytics, repurpose</li>
          <li>Voice: ElevenLabs Tee clone preferred · Piper TTS free fallback</li>
          <li>B-roll: Pexels matched per segment (static pool retired)</li>
          <li>Render: self-hosted worker · claim release on fail · Reaper for stale claims</li>
          <li>
            Audit CTA:{" "}
            <a
              href={DEFAULT_AUDIT_LANDING_URL}
              className="text-brass hover:underline"
              target="_blank"
              rel="noreferrer"
            >
              {DEFAULT_AUDIT_LANDING_URL}
            </a>
          </li>
        </ul>
        <div className="mt-8 flex flex-wrap gap-4">
          <Link
            href="/audit"
            className="rounded-sm bg-brass px-5 py-2.5 text-sm font-medium text-ink hover:bg-brass-dim"
          >
            Job Security Audit
          </Link>
          <Link
            href="/api/content/pipeline"
            className="rounded-sm border border-ink-border px-5 py-2.5 text-sm text-fog hover:border-brass"
          >
            Pipeline API contract
          </Link>
          <Link
            href="/dashboard"
            className="rounded-sm border border-ink-border px-5 py-2.5 text-sm text-fog hover:border-brass"
          >
            Operations
          </Link>
        </div>
      </section>
    </div>
  );
}
