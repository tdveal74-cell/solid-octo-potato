import { Button } from "quiet-operator";

export function Primary() {
  return <Button>Run your Job Security Audit</Button>;
}

export function Variants() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
      <Button variant="primary">Deliberate</Button>
      <Button variant="outline">See the Council</Button>
      <Button variant="ghost">+ Add task</Button>
      <Button variant="ghost-danger">remove</Button>
    </div>
  );
}

export function Sizes() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
      <Button size="md">Run audit</Button>
      <Button size="sm">Run audit</Button>
    </div>
  );
}

export function Disabled() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
      <Button disabled>Scoring…</Button>
      <Button variant="outline" disabled>
        See the Council
      </Button>
    </div>
  );
}

export function AsLink() {
  return <Button href="#audit">Run your Job Security Audit</Button>;
}
