import { defineCard } from "../define.js";

export default defineCard({
  name: "Tocasia's Dig Site",
  colors: [],
  types: ["land"],
  text: "{T}: Add {C}.\n{3}, {T}: Surveil 1. (Look at the top card of your library. You may put it into your graveyard.)",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "C", amount: 1 },
      resolve: null,
      text: "{T}: Add {C}.",
    },
    {
      cost: { mana: "{3}", tap: true },
      targets: [],
      effect: { kind: "surveil", amount: 1 },
      resolve: null,
      text: "{3}, {T}: Surveil 1.",
    },
  ],
});
