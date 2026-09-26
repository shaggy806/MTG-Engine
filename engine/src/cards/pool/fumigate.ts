import { defineCard } from "../define.js";

// "Destroyed this way": an indestructible creature doesn't count, one that
// was destroyed but exiled instead does (the rulings).
export default defineCard({
  name: "Fumigate",
  manaCost: "{3}{W}{W}",
  colors: ["W"],
  types: ["sorcery"],
  text: "Destroy all creatures. You gain 1 life for each creature destroyed this way.",
  effect: {
    kind: "sequence",
    effects: [
      { kind: "destroy-all", filter: { type: "creature" } },
      { kind: "gain-life", amount: { thisWay: "destroyed" } },
    ],
  },
});
