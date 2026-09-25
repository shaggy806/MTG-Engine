import { defineCard } from "../define.js";

export default defineCard({
  name: "Outlaw Medic",
  manaCost: "{1}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Human", "Rogue"],
  power: 1,
  toughness: 3,
  keywords: ["lifelink"],
  text: "Lifelink\nWhen this creature dies, draw a card.",
  triggered: [
    {
      trigger: { on: "dies", who: "self" },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: "When this creature dies, draw a card.",
    },
  ],
});
