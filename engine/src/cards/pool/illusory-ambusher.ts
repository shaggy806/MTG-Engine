import { defineCard } from "../define.js";

// "That many" is all the damage dealt, more than its toughness included (the
// ruling).
const DAMAGE_TEXT = "Whenever this creature is dealt damage, draw that many cards.";

export default defineCard({
  name: "Illusory Ambusher",
  manaCost: "{4}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Cat", "Illusion"],
  power: 4,
  toughness: 1,
  keywords: ["flash"],
  text: `Flash (You may cast this spell any time you could cast an instant.)\n${DAMAGE_TEXT}`,
  triggered: [
    {
      trigger: { on: "dealt-damage", who: "self" },
      targets: [],
      effect: { kind: "draw", amount: { triggerValue: true } },
      resolve: null,
      text: DAMAGE_TEXT,
    },
  ],
});
