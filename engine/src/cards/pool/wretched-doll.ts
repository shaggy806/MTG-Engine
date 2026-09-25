import { defineCard } from "../define.js";

export default defineCard({
  name: "Wretched Doll",
  manaCost: "{1}{B}",
  colors: ["B"],
  types: ["artifact", "creature"],
  subtypes: ["Toy"],
  power: 3,
  toughness: 1,
  text: "{B}, {T}: Surveil 1. (Look at the top card of your library. You may put that card into your graveyard.)",
  activated: [
    {
      cost: { mana: "{B}", tap: true },
      targets: [],
      effect: { kind: "surveil", amount: 1 },
      resolve: null,
      text: "{B}, {T}: Surveil 1.",
    },
  ],
});
