import Link from "next/link";
import { AGENTS, AGENT_IDS } from "@/lib/agents/registry";
import { COUNCILS } from "@/lib/council/councils";
import { COUNCIL_IDS } from "@/lib/council/types";
import { aiConfigured, MODELS } from "@/lib/ai/client";
import { Card, Eyebrow, SectionHeader, Stat, StatusPill } from "@/components";

// aiConfigured() reads process.env at request time — force dynamic rendering so
// the status reflects the running server, not the build machine.
export const dynamic = "force-dynamic";

export default function Dashboard() {
  const configured = aiConfigured();
  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <div className="flex items-end justify-between">
        <SectionHeader
          title="Operations"
          description="META SUPREME X system status and entry points."
        />
        <StatusPill tone={configured ? "green" : "amber"}>
          {configured ? "intelligence online" : "api key required"}
        </StatusPill>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Stat label="Councils seated" value={String(COUNCIL_IDS.length)} />
        <Stat label="Agents deployed" value={String(AGENT_IDS.length)} />
        <Stat label="Primary model" value={MODELS.PRIMARY} mono />
      </div>

      <div className="mt-12 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Link href="/council">
          <Card variant="raised" padding="md" interactive>
            <h2 className="text-lg font-semibold text-fog">Convene the Council</h2>
            <p className="mt-2 text-sm text-fog-dim">
              Eight councils, two phases, one recommendation. For decisions that
              deserve more than a single model&rsquo;s first take.
            </p>
            <Eyebrow className="mt-4">POST /api/council/deliberate</Eyebrow>
          </Card>
        </Link>
        <Link href="/audit">
          <Card variant="raised" padding="md" interactive>
            <h2 className="text-lg font-semibold text-fog">Job Security Audit</h2>
            <p className="mt-2 text-sm text-fog-dim">
              Deterministic task-level AI-exposure scoring, with an optional
              Council-grade roadmap on top.
            </p>
            <Eyebrow className="mt-4">POST /api/career/audit</Eyebrow>
          </Card>
        </Link>
      </div>

      <section className="mt-14">
        <Eyebrow as="h2" size="sm" mono={false} tone="dim">
          Council roster
        </Eyebrow>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {COUNCIL_IDS.map((id) => (
            <Card key={id} padding="xs">
              <p className="text-sm text-fog">{COUNCILS[id].name}</p>
              <p className="font-[family-name:var(--font-mono)] text-[10px] text-fog-dim">
                w={COUNCILS[id].weight.toFixed(1)}
              </p>
            </Card>
          ))}
        </div>
      </section>

      <section className="mt-10">
        <Eyebrow as="h2" size="sm" mono={false} tone="dim">
          Agent network
        </Eyebrow>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {AGENT_IDS.map((id) => (
            <Card key={id} padding="xs">
              <p className="text-sm text-fog">{AGENTS[id].name}</p>
              {AGENTS[id].escalateToCouncil && (
                <p className="font-[family-name:var(--font-mono)] text-[10px] text-brass">
                  council-reviewed
                </p>
              )}
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
