import { defineCard } from "../define.js";

export default defineCard({
  name: "Third Path Savant",
  manaCost: "{2}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Human", "Wizard"],
  power: 2,
  toughness: 3,
  text: "{7}: Draw two cards.",
  activated: [
    {
      cost: { mana: "{7}", tap: false },
      targets: [],
      effect: { kind: "draw", amount: 2 },
      resolve: null,
      text: "{7}: Draw two cards.",
    },
  ],
});
