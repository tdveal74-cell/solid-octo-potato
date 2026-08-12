import {
  PIPELINE_STAGES,
  DEFAULT_AUDIT_LANDING_URL,
  BRANDS,
  N8N_WORKFLOW,
  PIPELINE_TRIGGERS,
} from "@/lib/content/pipeline";
import {
  Badge,
  ButtonLink,
  Card,
  CardTitle,
  Eyebrow,
  Grid,
  Heading,
  Lede,
  Meta,
  Page,
  Section,
} from "@/components/ui/primitives";

export default function ContentPipelinePage() {
  return (
    <Page>
      <section className="py-16">
        <Eyebrow>Content Operating System</Eyebrow>
        <Heading level={1} size="lg" className="mt-4">
          TQO FINAL V5 Pipeline
        </Heading>
        <Lede className="mt-4">
          Dual-brand production engine. Rendering stays in n8n; this board is the in-app contract for
          status, brands, and human checkpoints so the platform and automation never drift.
        </Lede>

        <div className="mt-6 flex flex-wrap gap-3">
          <Badge tone="good" className="px-3 py-1.5 text-[10px]">
            {N8N_WORKFLOW.nodes} nodes · active
          </Badge>
          <Badge className="px-3 py-1.5 text-[10px]">{N8N_WORKFLOW.id}</Badge>
        </div>
      </section>

      <Section title="Brands">
        <Grid cols={2}>
          {Object.values(BRANDS).map((b) => (
            <Card key={b.id} raised>
              <Meta>{b.show}</Meta>
              <CardTitle className="mt-2 text-lg">{b.channel}</CardTitle>
              <p className="mt-2 text-sm text-fog-dim">{b.tagline}</p>
              <p className="mt-3 font-[family-name:var(--font-mono)] text-[10px] text-fog-dim">
                table {b.tableId}
              </p>
            </Card>
          ))}
        </Grid>
      </Section>

      {/* The stages are a sequence, so they are numbered and the one human gate
          is called out rather than sitting as an equal peer among automated steps. */}
      <Section
        title="Pipeline stages"
        lede="Everything before Ready is automated. Ready → Published is not, and never becomes so."
      >
        <Grid cols={3}>
          {PIPELINE_STAGES.map((stage, i) => {
            const isGate = stage.status === "Ready";
            return (
              <Card key={stage.status} raised className={isGate ? "border-brass-dim" : undefined}>
                <div className="flex items-center justify-between gap-2">
                  <Meta>Stage {i + 1}</Meta>
                  {isGate && <Badge tone="accent">human gate</Badge>}
                </div>
                <CardTitle className="mt-2 text-lg">{stage.label}</CardTitle>
                <p className="mt-2 text-xs text-fog-dim">{stage.owner}</p>
                {isGate && (
                  <p className="mt-3 text-xs text-brass">
                    Human Review required before Published. Never auto-ticked.
                  </p>
                )}
              </Card>
            );
          })}
        </Grid>
      </Section>

      <Section title="Schedules">
        <ul className="space-y-2 text-sm text-fog-dim">
          {PIPELINE_TRIGGERS.schedules.map((s) => (
            <li key={s.name}>
              <span className="text-fog">{s.name}</span>
              <span className="ml-2 font-[family-name:var(--font-mono)] text-[10px] text-fog-dim">
                {s.cron} · {s.brand}
              </span>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Live automation" className="pb-20">
        <ul className="space-y-2 text-sm text-fog-dim">
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
          <ButtonLink href="/audit" className="px-5 py-2.5">
            Job Security Audit
          </ButtonLink>
          <ButtonLink href="/api/content/pipeline" variant="secondary" className="px-5 py-2.5">
            Pipeline API contract
          </ButtonLink>
          <ButtonLink href="/dashboard" variant="secondary" className="px-5 py-2.5">
            Operations
          </ButtonLink>
        </div>
      </Section>
    </Page>
  );
}
