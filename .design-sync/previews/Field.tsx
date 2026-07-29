import { Field, TextInput, TextArea } from "quiet-operator";

export function WithInput() {
  return (
    <Field label="Your role" htmlFor="role">
      <TextInput id="role" placeholder="e.g. Senior Financial Analyst" />
    </Field>
  );
}

export function WithTextArea() {
  return (
    <Field label="Decision for the Council" htmlFor="q">
      <TextArea
        id="q"
        rows={4}
        placeholder="e.g. Should we launch the enterprise tier before the beta program closes, or wait for SOC 2 Type I?"
      />
    </Field>
  );
}

export function WithHint() {
  return (
    <Field label="Task name" htmlFor="task" hint="one line, verb first — e.g. 'Monthly variance reporting'">
      <TextInput id="task" defaultValue="Monthly variance reporting" />
    </Field>
  );
}
