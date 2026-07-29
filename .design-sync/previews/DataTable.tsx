import { DataTable } from "quiet-operator";

export function TaskBreakdown() {
  return (
    <DataTable
      columns={["Task", "Time", "Exposure", "Classification"]}
      rows={[
        ["Monthly variance reporting", "40%", "82", "automate"],
        ["Client relationship management", "30%", "24", "human leverage"],
        ["Board deck preparation", "20%", "61", "augment"],
        ["Ad-hoc financial modeling", "10%", "55", "augment"],
      ]}
    />
  );
}

export function CouncilVotes() {
  return (
    <DataTable
      columns={["Council", "Stance", "Confidence"]}
      rows={[
        ["Strategy", "endorse", "92%"],
        ["Security", "oppose", "64%"],
        ["Finance", "endorse with conditions", "71%"],
      ]}
    />
  );
}
