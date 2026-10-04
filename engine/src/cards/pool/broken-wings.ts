import { defineCard } from "../define.js";

// EDHREC rank 3956.

export default defineCard({
  name: "Broken Wings",
  manaCost: "{2}{G}",
  colors: ["G"],
  types: ["instant"],
  text: "Destroy target artifact, enchantment, or creature with flying.",
  targets: [
    {
      kind: "permanent",
      filter: { anyOf: [{ type: "artifact" }, { type: "enchantment" }, { type: "creature", keyword: "flying" }] },
    },
  ],
  effect: { kind: "destroy", target: 0 },
});
