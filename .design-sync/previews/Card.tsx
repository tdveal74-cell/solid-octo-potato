import { Card, Eyebrow } from "quiet-operator";

export function Raised() {
  return (
    <Card variant="raised">
      <h3 style={{ margin: 0, fontSize: "0.875rem", fontWeight: 600 }}>Strategy Council</h3>
      <p style={{ margin: "0.5rem 0 0", fontSize: "0.75rem", lineHeight: 1.6, color: "var(--color-fog-dim)" }}>
        Long-horizon positioning, competitive dynamics, and second-order effects of the decision.
      </p>
      <Eyebrow style={{ marginTop: "0.75rem" }}>weight 1.0</Eyebrow>
    </Card>
  );
}

export function Outline() {
  return (
    <Card>
      <h3 style={{ margin: 0, fontSize: "0.875rem", fontWeight: 600 }}>Research Analyst</h3>
      <p style={{ margin: "0.5rem 0 0", fontSize: "0.75rem", lineHeight: 1.6, color: "var(--color-fog-dim)" }}>
        Deep-dive investigation with sourced evidence and confidence levels.
      </p>
    </Card>
  );
}

export function Accent() {
  return (
    <Card variant="accent" padding="md">
      <Eyebrow>Supreme Orchestrator — proceed with conditions</Eyebrow>
      <h2 style={{ margin: "0.5rem 0 0", fontSize: "1.125rem", fontWeight: 600 }}>
        Launch the enterprise tier after SOC 2 Type I lands.
      </h2>
      <p style={{ margin: "0.75rem 0 0", fontSize: "0.875rem", lineHeight: 1.6, color: "var(--color-fog-dim)" }}>
        Seven of eight councils endorse; Security dissents on the audit timeline.
      </p>
    </Card>
  );
}

export function Interactive() {
  return (
    <Card variant="raised" padding="md" interactive>
      <h2 style={{ margin: 0, fontSize: "1.125rem", fontWeight: 600 }}>Convene the Council</h2>
      <p style={{ margin: "0.5rem 0 0", fontSize: "0.875rem", color: "var(--color-fog-dim)" }}>
        Eight councils, two phases, one recommendation.
      </p>
      <Eyebrow style={{ marginTop: "1rem" }}>POST /api/council/deliberate</Eyebrow>
    </Card>
  );
}

export function DenseRow() {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
      <Card padding="xs">
        <p style={{ margin: 0, fontSize: "0.875rem" }}>Strategy Council</p>
        <p style={{ margin: 0, fontFamily: "var(--font-mono)", fontSize: "0.625rem", color: "var(--color-fog-dim)" }}>
          w=1.0
        </p>
      </Card>
      <Card padding="xs">
        <p style={{ margin: 0, fontSize: "0.875rem" }}>Security Council</p>
        <p style={{ margin: 0, fontFamily: "var(--font-mono)", fontSize: "0.625rem", color: "var(--color-fog-dim)" }}>
          w=0.9
        </p>
      </Card>
    </div>
  );
}
