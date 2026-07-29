import Link from "next/link";
import { COUNCILS } from "@/lib/council/councils";
import { COUNCIL_IDS } from "@/lib/council/types";
import { AGENTS, AGENT_IDS } from "@/lib/agents/registry";
import { Card, Eyebrow, SectionHeader, StatusPill } from "@/components";

export default function Home() {
  return (
    <div className="mx-auto max-w-6xl px-6">
      {/* Hero */}
      <section className="py-24">
        <SectionHeader
          size="lg"
          eyebrow="AI Intelligence Operating System"
          title={
            <>
              Loud tools make noise.
              <br />
              Quiet operators make moves.
            </>
          }
          description="The Quiet Operator is not a chatbot. Every consequential answer is deliberated by the META SUPREME X Council — eight specialist councils that analyze independently, debate, and surface their disagreements before a recommendation ever reaches you."
        />
        <div className="mt-10 flex flex-col gap-4 sm:flex-row">
          <Link href="/audit" className="qo-btn qo-btn--primary">
            Run your Job Security Audit
          </Link>
          <Link href="/council" className="qo-btn qo-btn--outline">
            See the Council
          </Link>
        </div>
      </section>

      {/* Council */}
      <section className="border-t border-ink-border py-20">
        <SectionHeader
          level={2}
          title="The META SUPREME X Council"
          description="Independent analysis. Structured debate. Consensus scoring, contradiction detection, and risk evaluation — then one decisive recommendation, with dissent preserved."
        />
        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {COUNCIL_IDS.map((id) => {
            const c = COUNCILS[id];
            return (
              <Card key={id} variant="raised">
                <h3 className="text-sm font-semibold text-fog">{c.name}</h3>
                <p className="mt-2 text-xs leading-relaxed text-fog-dim">
                  {c.mandate}
                </p>
                <Eyebrow className="mt-3">weight {c.weight.toFixed(1)}</Eyebrow>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Agents */}
      <section className="border-t border-ink-border py-20">
        <SectionHeader level={2} title="Twelve specialist agents. One operating system." />
        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {AGENT_IDS.map((id) => {
            const a = AGENTS[id];
            return (
              <Card key={id}>
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-sm font-semibold text-fog">{a.name}</h3>
                  {a.escalateToCouncil && (
                    <StatusPill tone="brass" size="sm" className="shrink-0">
                      council-reviewed
                    </StatusPill>
                  )}
                </div>
                <p className="mt-2 text-xs leading-relaxed text-fog-dim">
                  {a.description}
                </p>
              </Card>
            );
          })}
        </div>
      </section>
    </div>
  );
}
