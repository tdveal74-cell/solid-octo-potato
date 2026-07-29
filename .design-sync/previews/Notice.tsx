import { Notice } from "quiet-operator";

export function Error() {
  return <Notice tone="red">Deliberation failed — the Council could not reach the API.</Notice>;
}

export function InProgress() {
  return (
    <Notice tone="brass" pulse>
      Eight councils in session — this can take a few minutes…
    </Notice>
  );
}

export function Tones() {
  return (
    <div style={{ display: "grid", gap: "0.5rem" }}>
      <Notice tone="green">Audit complete — results below.</Notice>
      <Notice tone="amber">Two councils attached conditions to their endorsement.</Notice>
      <Notice tone="dim">No safe harbor: every task you listed sits in the automate band.</Notice>
    </div>
  );
}
