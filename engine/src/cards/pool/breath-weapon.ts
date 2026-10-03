import { defineCard } from "../define.js";

export default defineCard({
  name: "Breath Weapon",
  manaCost: "{2}{R}",
  colors: ["R"],
  types: ["instant"],
  text: "Breath Weapon deals 2 damage to each non-Dragon creature.",
  effect: { kind: "damage-all", filter: { type: "creature", notSubtypes: ["Dragon"] }, amount: 2 },
});
