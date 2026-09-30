import { defineCard } from "../define.js";

export default defineCard({
  name: "Storm's Wrath",
  manaCost: "{2}{R}{R}",
  colors: ["R"],
  types: ["sorcery"],
  text: "Storm's Wrath deals 4 damage to each creature and each planeswalker.",
  effect: { kind: "damage-all", filter: { typesAnyOf: ["creature", "planeswalker"] }, amount: 4 },
});
