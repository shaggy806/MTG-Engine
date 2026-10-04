import { defineCard } from "../define.js";

// EDHREC rank 6069.

export default defineCard({
  name: "Exorcise",
  manaCost: "{1}{W}",
  colors: ["W"],
  types: ["sorcery"],
  text: "Exile target artifact, enchantment, or creature with power 4 or greater.",
  targets: [
    {
      kind: "permanent",
      filter: {
        anyOf: [
          { type: "artifact" },
          { type: "enchantment" },
          { type: "creature", power: { op: "gte", n: 4 } },
        ],
      },
    },
  ],
  effect: { kind: "exile", target: 0 },
});
