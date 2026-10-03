import { defineCard } from "../define.js";

export default defineCard({
  name: "Calamity of Cinders",
  manaCost: "{5}{R}{R}",
  colors: ["R"],
  types: ["sorcery"],
  text:
    "Convoke (Your creatures can help cast this spell. Each creature you tap while casting this spell pays for {1} or one mana of that creature's color.)\n" +
    "Calamity of Cinders deals 6 damage to each untapped creature.",
  convoke: true,
  effect: { kind: "damage-all", filter: { type: "creature", tapped: false }, amount: 6 },
});
