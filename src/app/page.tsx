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
          The Quiet Operator is not a chatbot. Every consequential answer is deliberated by the META
          SUPREME X Council — eight specialist councils that analyze independently, debate, and
          surface their disagreements before a recommendation ever reaches you.
        </Lede>
        {/* One brass action. The second route is available, not advertised. */}
        <div className="mt-10 flex flex-col gap-4 sm:flex-row">
          <ButtonLink href="/audit">Run your Job Security Audit</ButtonLink>
          <ButtonLink href="/council" variant="secondary">
            See the Council
          </ButtonLink>
        </div>
      </section>

      <Section
        title="The META SUPREME X Council"
        lede="Independent analysis. Structured debate. Consensus scoring, contradiction detection, and risk evaluation — then one decisive recommendation, with dissent preserved."
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
        lede="Each agent owns a domain and answers within it. The ones that carry consequence do not answer alone — they escalate to the Council and come back with the dissent attached."
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
