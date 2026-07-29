import { Stat } from "quiet-operator";

export function Canonical() {
  return <Stat label="Councils seated" value="8" />;
}

export function MonoValue() {
  return <Stat label="Primary model" value="claude-opus-4-8" mono />;
}

export function MetricGrid() {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem" }}>
      <Stat center label="Support" value="78" sub="strong agreement (0.86)" />
      <Stat center label="Aggregate risk" value="31" sub="medium" />
      <Stat center label="Contradictions" value="2" sub="94s deliberation" />
    </div>
  );
}
