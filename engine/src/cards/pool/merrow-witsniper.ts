import { defineCard } from "../define.js";

export default defineCard({
  name: "Merrow Witsniper",
  manaCost: "{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Merfolk", "Rogue"],
  power: 1,
  toughness: 1,
  text: "When this creature enters, target player mills a card.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: ["player"],
      effect: { kind: "mill", target: 0, amount: 1 },
      resolve: null,
      text: "When this creature enters, target player mills a card.",
    },
  ],
});
