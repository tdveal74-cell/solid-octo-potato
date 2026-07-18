import Link from "next/link";
import { AGENTS, AGENT_IDS } from "@/lib/agents/registry";
import { COUNCILS } from "@/lib/council/councils";
import { COUNCIL_IDS } from "@/lib/council/types";
import { aiConfigured, MODELS } from "@/lib/ai/client";

// aiConfigured() reads process.env at request time — force dynamic rendering so
// the status reflects the running server, not the build machine.
export const dynamic = "force-dynamic";

export default function Dashboard() {
  const configured = aiConfigured();
  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-4xl text-fog">
            Operations
          </h1>
          <p className="mt-2 text-fog-dim">META SUPREME X system status and entry points.</p>
        </div>
        <span
          className={`rounded-sm border px-3 py-1.5 font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-widest ${
            configured
              ? "border-signal-green text-signal-green"
              : "border-signal-amber text-signal-amber"
          }`}
        >
          {configured ? "intelligence online" : "api key required"}
        </span>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Councils seated" value={String(COUNCIL_IDS.length)} />
        <StatCard label="Agents deployed" value={String(AGENT_IDS.length)} />
        <StatCard label="Primary model" value={MODELS.PRIMARY} mono />
      </div>

      <div className="mt-12 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Link
          href="/council"
          className="rounded-sm border border-ink-border bg-ink-raised p-6 hover:border-brass"
        >
          <h2 className="text-lg font-semibold text-fog">Convene the Council</h2>
          <p className="mt-2 text-sm text-fog-dim">
            Eight councils, two phases, one recommendation. For decisions that
            deserve more than a single model&rsquo;s first take.
          </p>
          <p className="mt-4 font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-widest text-brass">
            POST /api/council/deliberate
          </p>
        </Link>
        <Link
          href="/audit"
          className="rounded-sm border border-ink-border bg-ink-raised p-6 hover:border-brass"
        >
          <h2 className="text-lg font-semibold text-fog">Job Security Audit</h2>
          <p className="mt-2 text-sm text-fog-dim">
            Deterministic task-level AI-exposure scoring, with an optional
            Council-grade roadmap on top.
          </p>
          <p className="mt-4 font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-widest text-brass">
            POST /api/career/audit
          </p>
        </Link>
      </div>

      <section className="mt-14">
        <h2 className="text-xs uppercase tracking-widest text-fog-dim">Council roster</h2>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {COUNCIL_IDS.map((id) => (
            <div key={id} className="rounded-sm border border-ink-border px-4 py-3">
              <p className="text-sm text-fog">{COUNCILS[id].name}</p>
              <p className="font-[family-name:var(--font-mono)] text-[10px] text-fog-dim">
                w={COUNCILS[id].weight.toFixed(1)}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-xs uppercase tracking-widest text-fog-dim">Agent network</h2>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {AGENT_IDS.map((id) => (
            <div key={id} className="rounded-sm border border-ink-border px-4 py-3">
              <p className="text-sm text-fog">{AGENTS[id].name}</p>
              {AGENTS[id].escalateToCouncil && (
                <p className="font-[family-name:var(--font-mono)] text-[10px] text-brass">
                  council-reviewed
                </p>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function StatCard({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="rounded-sm border border-ink-border bg-ink-raised p-5">
      <p className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-widest text-fog-dim">
        {label}
      </p>
      <p
        className={`mt-2 text-2xl text-brass ${
          mono ? "font-[family-name:var(--font-mono)] text-lg" : "font-[family-name:var(--font-display)]"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
