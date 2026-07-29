import { ArrowList, Eyebrow } from "quiet-operator";

export function Conditions() {
  return (
    <ArrowList
      tone="amber"
      items={[
        "Complete SOC 2 Type I before any enterprise contract is signed",
        "Cap beta seats at 50 until support headcount doubles",
      ]}
    />
  );
}

export function Tasks() {
  return (
    <ArrowList
      items={[
        "Client relationship management",
        "Cross-team negotiation and alignment",
        "Novel deal structuring",
      ]}
    />
  );
}

export function Dissent() {
  return (
    <div>
      <Eyebrow size="sm" mono={false} tone="dim">
        Dissent on record
      </Eyebrow>
      <ArrowList
        style={{ marginTop: "0.5rem" }}
        marker="dash"
        tone="dim"
        items={[
          "Security Council: the audit timeline is optimistic by a quarter.",
          "Finance Council: pricing does not cover the support load at scale.",
        ]}
      />
    </div>
  );
}
