import { Button, Eyebrow, SectionHeader, Surface } from "quiet-operator";

export function Canvas() {
  return (
    <Surface>
      <Eyebrow>The root canvas</Eyebrow>
      <p style={{ margin: "0.5rem 0 0", fontSize: "0.875rem", lineHeight: 1.6 }}>
        Ink background, fog text, body type stack. Every screen built with The
        Quiet Operator sits on a Surface.
      </p>
    </Surface>
  );
}

export function WithContent() {
  return (
    <Surface>
      <SectionHeader
        level={2}
        title="Convene the Council"
        description="Put a decision before all eight councils and get a scored recommendation with dissent preserved."
      />
      <div style={{ marginTop: "1.5rem", display: "flex", gap: "1rem" }}>
        <Button>Deliberate</Button>
        <Button variant="outline">See the Council</Button>
      </div>
    </Surface>
  );
}
