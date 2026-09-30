import { defineCard } from "../define.js";

export default defineCard({
  name: "Draconic Lore",
  manaCost: "{5}{U}",
  colors: ["U"],
  types: ["instant"],
  text: "This spell costs {2} less to cast if you control a Dragon.\nDraw three cards.",
  selfCostReduction: {
    condition: { kind: "controls", filter: { subtype: "Dragon" }, atLeast: 1 },
    reduceGeneric: 2,
  },
  effect: { kind: "draw", amount: 3 },
});
