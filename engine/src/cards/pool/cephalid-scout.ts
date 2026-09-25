import { defineCard } from "../define.js";

export default defineCard({
  name: "Cephalid Scout",
  manaCost: "{1}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Octopus", "Wizard", "Scout"],
  power: 1,
  toughness: 1,
  keywords: ["flying"],
  text: "Flying\n{2}{U}, Sacrifice a land: Draw a card.",
  activated: [
    {
      cost: { mana: "{2}{U}", tap: false, sacrifice: { filter: { type: "land" } } },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: "{2}{U}, Sacrifice a land: Draw a card.",
    },
  ],
});
