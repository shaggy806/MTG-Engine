import { defineCard } from "../define.js";

export default defineCard({
  name: "Azure Mage",
  manaCost: "{1}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Human", "Wizard"],
  power: 2,
  toughness: 1,
  text: "{3}{U}: Draw a card.",
  activated: [
    {
      cost: { mana: "{3}{U}", tap: false },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: "{3}{U}: Draw a card.",
    },
  ],
});
