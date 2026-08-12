import Link from "next/link";
import { AGENTS, AGENT_IDS } from "@/lib/agents/registry";
import { COUNCILS } from "@/lib/council/councils";
import { COUNCIL_IDS } from "@/lib/council/types";
import { aiConfigured, MODELS } from "@/lib/ai/client";
import { N8N_WORKFLOW, BRANDS } from "@/lib/content/pipeline";
import {
  Badge,
  Card,
  CardTitle,
  Grid,
  Heading,
  Lede,
  Meta,
  Page,
  Section,
  Stat,
} from "@/components/ui/primitives";

export const dynamic = "force-dynamic";

const ENTRY_POINTS = [
  {
    href: "/council",
    title: "Convene the Council",
    body: "Eight councils, two phases, one recommendation. For decisions that deserve more than a single model’s first take.",
    endpoint: "POST /api/council/deliberate",
  },
  {
    href: "/audit",
    title: "Job Security Audit",
    body: "Deterministic task-level AI-exposure scoring, with an optional Council-grade roadmap on top.",
    endpoint: "POST /api/career/audit",
  },
  {
    href: "/content",
    title: "Content Pipeline",
    body: `${N8N_WORKFLOW.name}: ${Object.keys(BRANDS).length} brands, ${N8N_WORKFLOW.nodes} nodes, Human Review gate before publish.`,
    endpoint: "GET /api/content/pipeline",
  },
];

export default function Dashboard() {
  const configured = aiConfigured();

  return (
    <Page>
      <section className="py-16">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <Heading level={1} size="lg">
              Operations
            </Heading>
            <Lede className="mt-2">META SUPREME X system status and entry points.</Lede>
          </div>
          {/* The one live signal on the page, so it gets the colour. */}
          <Badge tone={configured ? "good" : "warn"} className="px-3 py-1.5 text-[10px]">
            {configured ? "intelligence online" : "api key required"}
          </Badge>
        </div>

        {/* Figures read in fog: they are facts, not alerts. Colour here would
            compete with the status badge above, which is the actual signal. */}
        <Grid cols={4} className="mt-10">
          <Stat label="Councils seated" value={COUNCIL_IDS.length} />
          <Stat label="Agents deployed" value={AGENT_IDS.length} />
          <Stat label="Pipeline nodes" value={N8N_WORKFLOW.nodes} />
          <Stat
            label="Primary model"
            value={
              <span className="font-[family-name:var(--font-mono)] text-base">{MODELS.PRIMARY}</span>
            }
          />
        </Grid>

        <Grid cols={3} className="mt-12 gap-6">
          {ENTRY_POINTS.map((e) => (
            <Link key={e.href} href={e.href} className="block">
              <Card raised interactive className="h-full p-6">
                <CardTitle className="text-lg">{e.title}</CardTitle>
                <p className="mt-2 text-sm leading-relaxed text-fog-dim">{e.body}</p>
                <Meta className="mt-4">{e.endpoint}</Meta>
              </Card>
            </Link>
          ))}
        </Grid>
      </section>

      <Section title="Council roster">
        <Grid cols={4} className="gap-3">
          {COUNCIL_IDS.map((id) => (
            <Card key={id} className="px-4 py-3">
              <p className="text-sm text-fog">{COUNCILS[id].name}</p>
              <p className="font-[family-name:var(--font-mono)] text-[10px] text-fog-dim">
                w={COUNCILS[id].weight.toFixed(1)}
              </p>
            </Card>
          ))}
        </Grid>
      </Section>

      <Section title="Agent network" className="pb-20">
        <Grid cols={4} className="gap-3">
          {AGENT_IDS.map((id) => (
            <Card key={id} className="flex items-start justify-between gap-2 px-4 py-3">
              <p className="text-sm text-fog">{AGENTS[id].name}</p>
              {AGENTS[id].escalateToCouncil && <Badge tone="accent">council</Badge>}
            </Card>
          ))}
        </Grid>
      </Section>
    </Page>
  );
}
