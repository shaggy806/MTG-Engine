import { defineCard } from "../define.js";

// The target's power is read as the spell resolves; the target itself isn't
// "greater than" itself, so it survives.
export default defineCard({
  name: "Fell the Mighty",
  manaCost: "{4}{W}",
  colors: ["W"],
  types: ["sorcery"],
  text: "Destroy all creatures with power greater than target creature's power.",
  targets: ["creature"],
  effect: {
    kind: "destroy-all",
    filter: { type: "creature", power: { op: "gt", n: { amount: { powerOf: 0 } } } },
  },
});
