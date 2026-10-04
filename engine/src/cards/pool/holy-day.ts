import { defineCard } from "../define.js";

// EDHREC rank 5904.

export default defineCard({
  name: "Holy Day",
  manaCost: "{W}",
  colors: ["W"],
  types: ["instant"],
  text: "Prevent all combat damage that would be dealt this turn.",
  effect: { kind: "prevent-all-combat-damage" },
});
