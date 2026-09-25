import { defineCard } from "../define.js";

export default defineCard({
  name: "Cathartic Adept",
  manaCost: "{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Human", "Wizard"],
  power: 1,
  toughness: 1,
  text: "{T}: Target player mills a card.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: ["player"],
      effect: { kind: "mill", target: 0, amount: 1 },
      resolve: null,
      text: "{T}: Target player mills a card.",
    },
  ],
});
