import { defineCard } from "../define.js";

export default defineCard({
  name: "Archivist",
  manaCost: "{2}{U}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Human", "Wizard"],
  power: 1,
  toughness: 1,
  text: "{T}: Draw a card.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: "{T}: Draw a card.",
    },
  ],
});
