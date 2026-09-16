import { defineCard } from "../define.js";

export default defineCard({
  name: "Winged Words",
  manaCost: "{2}{U}",
  colors: ["U"],
  types: ["sorcery"],
  text:
    "This spell costs {1} less to cast if you control a creature with flying.\n" +
    "Draw two cards.",
  selfCostReduction: {
    condition: {
      kind: "controls",
      filter: { type: "creature", keyword: "flying" },
      atLeast: 1,
    },
    reduceGeneric: 1,
  },
  effect: { kind: "draw", amount: 2 },
});
