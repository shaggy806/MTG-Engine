import { defineCard } from "../define.js";

export default defineCard({
  name: "Rune-Sealed Wall",
  manaCost: "{2}{U}",
  colors: ["U"],
  types: ["artifact", "creature"],
  subtypes: ["Wall"],
  power: 0,
  toughness: 6,
  keywords: ["defender"],
  text: "Defender\n{T}: Surveil 1. (Look at the top card of your library. You may put it into your graveyard.)",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "surveil", amount: 1 },
      resolve: null,
      text: "{T}: Surveil 1.",
    },
  ],
});
