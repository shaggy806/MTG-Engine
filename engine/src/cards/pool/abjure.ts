import { defineCard } from "../define.js";

// EDHREC rank 6215.
//
// Bone Splinters' mandatory additional sacrifice (rule 601.2f), of a blue
// permanent.
export default defineCard({
  name: "Abjure",
  manaCost: "{U}",
  colors: ["U"],
  types: ["instant"],
  text: "As an additional cost to cast this spell, sacrifice a blue permanent.\nCounter target spell.",
  additionalCost: { sacrifice: { colors: ["U"], controlledBy: "you" } },
  targets: ["spell"],
  effect: { kind: "counter", target: 0 },
});
