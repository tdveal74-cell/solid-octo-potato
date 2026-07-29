import { StatusPill } from "quiet-operator";

export function Online() {
  return <StatusPill tone="green">intelligence online</StatusPill>;
}

export function Tones() {
  return (
    <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "center" }}>
      <StatusPill tone="green">intelligence online</StatusPill>
      <StatusPill tone="amber">api key required</StatusPill>
      <StatusPill tone="red">deliberation failed</StatusPill>
      <StatusPill tone="brass">council-reviewed</StatusPill>
      <StatusPill tone="neutral">offline</StatusPill>
    </div>
  );
}

export function SmallBadge() {
  return (
    <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
      <span style={{ fontSize: "0.875rem", fontWeight: 600 }}>Career Strategist</span>
      <StatusPill tone="brass" size="sm">
        council-reviewed
      </StatusPill>
    </div>
  );
}
