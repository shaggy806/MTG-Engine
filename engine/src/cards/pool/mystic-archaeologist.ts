import { defineCard } from "../define.js";

export default defineCard({
  name: "Mystic Archaeologist",
  manaCost: "{1}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Human", "Wizard"],
  power: 2,
  toughness: 1,
  text: "{3}{U}{U}: Draw two cards.",
  activated: [
    {
      cost: { mana: "{3}{U}{U}", tap: false },
      targets: [],
      effect: { kind: "draw", amount: 2 },
      resolve: null,
      text: "{3}{U}{U}: Draw two cards.",
    },
  ],
});
