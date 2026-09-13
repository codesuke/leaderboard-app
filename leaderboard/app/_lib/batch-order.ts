// Deliberately untyped as Batch (which lives in students.ts) and with no
// imports of its own: even a type-only import back to students.ts would
// create an import cycle that pulls students.ts's server-only filesystem
// code into the client bundle via ranking.ts. Consumers cast this to Batch[].
export const RAW_BATCH_ORDER: readonly string[] = [
  "S1",
  "S2",
  "T1",
  "T2",
  "T3",
  "T4",
  "T5",
  "T6",
  "T7",
  "T8",
  "T9",
  "T10",
  "T11",
  "T12",
  "T13",
];
