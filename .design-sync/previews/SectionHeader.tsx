import { SectionHeader } from "quiet-operator";

export function Hero() {
  return (
    <SectionHeader
      size="lg"
      eyebrow="AI Intelligence Operating System"
      title={
        <>
          Loud tools make noise.
          <br />
          Quiet operators make moves.
        </>
      }
      description="The Quiet Operator is not a chatbot. Every consequential answer is deliberated by the META SUPREME X Council — eight specialist councils that analyze independently, debate, and surface their disagreements before a recommendation ever reaches you."
    />
  );
}

export function PageTitle() {
  return (
    <SectionHeader
      title="Job Security Audit"
      description="Your job title doesn't get automated — your tasks do. Break your role into tasks, rate each one, and get a deterministic AI-exposure score."
    />
  );
}

export function SectionTitle() {
  return (
    <SectionHeader
      level={2}
      title="The META SUPREME X Council"
      description="Independent analysis. Structured debate. Consensus scoring, contradiction detection, and risk evaluation — then one decisive recommendation, with dissent preserved."
    />
  );
}
