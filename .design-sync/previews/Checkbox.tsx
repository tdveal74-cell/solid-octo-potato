import { Checkbox } from "quiet-operator";

export function Checked() {
  return <Checkbox defaultChecked label="Include debate round (phase 2)" />;
}

export function Unchecked() {
  return <Checkbox label="Escalate high-stakes output to the Council" />;
}
