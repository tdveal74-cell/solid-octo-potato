import { COUNCILS } from "@/lib/council/councils";
import { COUNCIL_IDS } from "@/lib/council/types";
import { AGENTS, AGENT_IDS } from "@/lib/agents/registry";
import {
  Badge,
  ButtonLink,
  Card,
  CardBody,
  CardTitle,
  Eyebrow,
  Grid,
  Heading,
  Lede,
  Meta,
  Page,
  Section,
} from "@/components/ui/primitives";

export default function Home() {
  return (
    <Page>
      <section className="py-24">
        <Eyebrow>AI Intelligence Operating System</Eyebrow>
        <Heading level={1} size="hero" className="mt-6 max-w-3xl">
          Loud tools make noise.
          <br />
          Quiet operators make moves.
        </Heading>
        <Lede className="mt-6 text-lg">
          Not a chatbot. Every consequential answer runs the META SUPREME X Council —
          eight seats that analyze independently, debate, and surface disagreement before
          one recommendation reaches you. Dissent stays on the record.
        </Lede>
        <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
          <ButtonLink href="/council">Convene the Council</ButtonLink>
          <ButtonLink href="/audit" variant="secondary">
            Job Security Audit
          </ButtonLink>
          <ButtonLink href="/dashboard" variant="ghost">
            Operations
          </ButtonLink>
        </div>
        <p className="mt-6 max-w-xl text-xs leading-relaxed text-fog-dim">
          Primary path is deliberation. Audit is deterministic and works offline. Content
          publish still requires human review — never auto-ticked.
        </p>
      </section>

      <Section
        title="What a Council run returns"
        lede="A decision package — not a chat bubble. Recommendation, conditions, dissent, and the evidence you need to act or refuse."
      >
        <Grid cols={4}>
          {[
            {
              t: "Recommendation",
              b: "One clear decision from the Supreme Orchestrator, with rationale.",
            },
            {
              t: "Conditions",
              b: "What must be true before the recommendation is safe to execute.",
            },
            {
              t: "Dissent",
              b: "Minority seats stay visible. Agreement is scored, not assumed.",
            },
            {
              t: "Risks",
              b: "Severity-tagged risks from the seats that actually own them.",
            },
          ].map((x) => (
            <Card key={x.t} raised>
              <CardTitle>{x.t}</CardTitle>
              <CardBody>{x.b}</CardBody>
            </Card>
          ))}
        </Grid>
      </Section>

      <Section
        title="The META SUPREME X Council"
        lede="Independent analysis. Structured debate. Consensus scoring and contradiction detection — then one decisive recommendation."
      >
        <Grid cols={4}>
          {COUNCIL_IDS.map((id) => {
            const c = COUNCILS[id];
            return (
              <Card key={id} raised>
                <CardTitle>{c.name}</CardTitle>
                <CardBody>{c.mandate}</CardBody>
                <Meta className="mt-3">weight {c.weight.toFixed(1)}</Meta>
              </Card>
            );
          })}
        </Grid>
      </Section>

      <Section
        title="Twelve specialist agents. One operating system."
        lede="Each agent owns a domain. High-stakes answers escalate to the Council and return with dissent attached."
      >
        <Grid cols={3}>
          {AGENT_IDS.map((id) => {
            const a = AGENTS[id];
            return (
              <Card key={id}>
                <div className="flex items-start justify-between gap-2">
                  <CardTitle>{a.name}</CardTitle>
                  {a.escalateToCouncil && <Badge tone="accent">council-reviewed</Badge>}
                </div>
                <CardBody>{a.description}</CardBody>
              </Card>
            );
          })}
        </Grid>
      </Section>
    </Page>
  );
}
