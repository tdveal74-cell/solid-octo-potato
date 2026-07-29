import { TextArea } from "quiet-operator";

export function Placeholder() {
  return (
    <TextArea
      rows={4}
      placeholder="e.g. Should we launch the enterprise tier before the beta program closes, or wait for SOC 2 Type I?"
    />
  );
}

export function Filled() {
  return (
    <TextArea
      rows={4}
      defaultValue="Should we migrate the billing system to usage-based pricing this quarter, or wait until the enterprise contracts renew in Q3?"
    />
  );
}
