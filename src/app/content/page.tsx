import Link from "next/link";
import { PIPELINE_STAGES, DEFAULT_AUDIT_LANDING_URL } from "@/lib/content/pipeline";

export default function ContentPipelinePage() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-16">
      <p className="font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.3em] text-brass">
        Content Operating System
      </p>
      <h1 className="mt-4 font-[family-name:var(--font-display)] text-4xl text-fog">
        TQO Content Pipeline
      </h1>
      <p className="mt-4 max-w-2xl text-fog-dim">
        Production rendering stays in n8n (Airtable → Claude → ElevenLabs →
        JSON2Video). This board is the in-app contract for status, voice, and
        human checkpoints so the platform and automation never drift.
      </p>

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
                Human checkpoint required before Published.
              </p>
            )}
          </div>
        ))}
      </div>

      <section className="mt-16 border-t border-ink-border pt-12">
        <h2 className="font-[family-name:var(--font-display)] text-2xl text-fog">
          Live automation (Drive / n8n)
        </h2>
        <ul className="mt-4 space-y-2 text-sm text-fog-dim">
          <li>TQO-Content-Pipeline.json — script, promote, render</li>
          <li>TQO - Platform Packaging Pipeline.json — multi-platform captions</li>
          <li>
            Audit CTA in scripts:{" "}
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
        </div>
      </section>
    </div>
  );
}
