import { RangeField } from "quiet-operator";

export function Canonical() {
  return (
    <div style={{ maxWidth: "10rem" }}>
      <RangeField
        label="Routine"
        valueLabel={7}
        hint="rule-based / repeatable"
        min={0}
        max={10}
        defaultValue={7}
      />
    </div>
  );
}

export function FactorRow() {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "1rem" }}>
      <RangeField label="Routine" valueLabel={7} hint="rule-based / repeatable" min={0} max={10} defaultValue={7} />
      <RangeField label="Digital" valueLabel={8} hint="pure information work" min={0} max={10} defaultValue={8} />
      <RangeField label="Creative" valueLabel={4} hint="novel judgment (protective)" min={0} max={10} defaultValue={4} />
      <RangeField label="Human" valueLabel={3} hint="trust & relationships (protective)" min={0} max={10} defaultValue={3} />
      <RangeField label="Physical" valueLabel={1} hint="physical presence (protective)" min={0} max={10} defaultValue={1} />
    </div>
  );
}
