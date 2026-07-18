import Link from "next/link";
import { COUNCILS } from "@/lib/council/councils";
import { COUNCIL_IDS } from "@/lib/council/types";
import { AGENTS, AGENT_IDS } from "@/lib/agents/registry";

export default function Home() {
  return (
    <div className="mx-auto max-w-6xl px-6">
      {/* Hero */}
      <section className="py-24">
        <p className="font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.3em] text-brass">
          AI Intelligence Operating System
        </p>
        <h1 className="mt-6 max-w-3xl font-[family-name:var(--font-display)] text-5xl leading-tight text-fog">
          Loud tools make noise.
          <br />
          Quiet operators make moves.
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-fog-dim">
          The Quiet Operator is not a chatbot. Every consequential answer is
          deliberated by the META SUPREME X Council — eight specialist councils
          that analyze independently, debate, and surface their disagreements
          before a recommendation ever reaches you.
        </p>
        <div className="mt-10 flex flex-col gap-4 sm:flex-row">
          <Link
            href="/audit"
            className="rounded-sm bg-brass px-6 py-3 text-sm font-medium text-ink hover:bg-brass-dim"
          >
            Run your Job Security Audit
          </Link>
          <Link
            href="/council"
            className="rounded-sm border border-ink-border px-6 py-3 text-sm text-fog hover:border-brass"
          >
            See the Council
          </Link>
        </div>
      </section>

      {/* Council */}
      <section className="border-t border-ink-border py-20">
        <h2 className="font-[family-name:var(--font-display)] text-3xl text-fog">
          The META SUPREME X Council
        </h2>
        <p className="mt-3 max-w-2xl text-fog-dim">
          Independent analysis. Structured debate. Consensus scoring,
          contradiction detection, and risk evaluation — then one decisive
          recommendation, with dissent preserved.
        </p>
        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {COUNCIL_IDS.map((id) => {
            const c = COUNCILS[id];
            return (
              <div
                key={id}
                className="rounded-sm border border-ink-border bg-ink-raised p-5"
              >
                <h3 className="text-sm font-semibold text-fog">{c.name}</h3>
                <p className="mt-2 text-xs leading-relaxed text-fog-dim">
                  {c.mandate}
                </p>
                <p className="mt-3 font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-widest text-brass">
                  weight {c.weight.toFixed(1)}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Agents */}
      <section className="border-t border-ink-border py-20">
        <h2 className="font-[family-name:var(--font-display)] text-3xl text-fog">
          Twelve specialist agents. One operating system.
        </h2>
        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {AGENT_IDS.map((id) => {
            const a = AGENTS[id];
            return (
              <div
                key={id}
                className="rounded-sm border border-ink-border p-5"
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-sm font-semibold text-fog">{a.name}</h3>
                  {a.escalateToCouncil && (
                    <span className="shrink-0 rounded-sm border border-brass-dim px-1.5 py-0.5 font-[family-name:var(--font-mono)] text-[9px] uppercase tracking-widest text-brass">
                      council-reviewed
                    </span>
                  )}
                </div>
                <p className="mt-2 text-xs leading-relaxed text-fog-dim">
                  {a.description}
                </p>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
