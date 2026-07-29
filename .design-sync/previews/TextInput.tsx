import { TextInput } from "quiet-operator";

export function Placeholder() {
  return <TextInput placeholder="e.g. Senior Financial Analyst" />;
}

export function Filled() {
  return <TextInput defaultValue="Senior Financial Analyst" />;
}

export function Small() {
  return <TextInput inputSize="sm" placeholder='Task 1, e.g. "Monthly variance reporting"' />;
}

export function NumberInput() {
  return (
    <div style={{ maxWidth: "5rem" }}>
      <TextInput inputSize="sm" type="number" min={0} max={100} defaultValue={25} />
    </div>
  );
}
