import { defineCard } from "../define.js";

// EDHREC rank 6138.

export default defineCard({
  name: "Make Your Move",
  manaCost: "{2}{W}",
  colors: ["W"],
  types: ["instant"],
  text: "Destroy target artifact, enchantment, or creature with power 4 or greater.",
  targets: [
    {
      kind: "permanent",
      filter: {
        anyOf: [{ type: "artifact" }, { type: "enchantment" }, { type: "creature", power: { op: "gte", n: 4 } }],
      },
    },
  ],
  effect: { kind: "destroy", target: 0 },
});
