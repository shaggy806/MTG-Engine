import { defineCard } from "../define.js";

export default defineCard({
  name: "Zuran Enchanter",
  manaCost: "{1}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Human", "Wizard"],
  power: 1,
  toughness: 1,
  text: "{2}{B}, {T}: Target player discards a card. Activate only during your turn.",
  activated: [
    {
      cost: { mana: "{2}{B}", tap: true },
      targets: ["player"],
      effect: { kind: "discard", target: 0, amount: 1 },
      resolve: null,
      text: "{2}{B}, {T}: Target player discards a card. Activate only during your turn.",
      condition: { kind: "your-turn" },
    },
  ],
});
