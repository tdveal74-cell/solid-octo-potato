import { Eyebrow } from "quiet-operator";

export function Brass() {
  return <Eyebrow>POST /api/council/deliberate</Eyebrow>;
}

export function Tones() {
  return (
    <div style={{ display: "grid", gap: "0.5rem" }}>
      <Eyebrow tone="brass">weight 1.0</Eyebrow>
      <Eyebrow tone="dim">Councils seated</Eyebrow>
      <Eyebrow tone="green">endorse · 92%</Eyebrow>
      <Eyebrow tone="amber">endorse with conditions · 71%</Eyebrow>
      <Eyebrow tone="red">oppose · 64%</Eyebrow>
    </div>
  );
}

export function SectionLabel() {
  return (
    <Eyebrow as="h2" size="sm" mono={false} tone="dim">
      Council roster
    </Eyebrow>
  );
}

export function HeroKicker() {
  return (
    <Eyebrow size="sm" wide>
      AI Intelligence Operating System
    </Eyebrow>
  );
}
