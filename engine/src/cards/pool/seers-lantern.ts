import { defineCard } from "../define.js";

export default defineCard({
  name: "Seer's Lantern",
  manaCost: "{3}",
  colors: [],
  types: ["artifact"],
  text: "{T}: Add {C}.\n{2}, {T}: Scry 1. (Look at the top card of your library. You may put that card on the bottom.)",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "C", amount: 1 },
      resolve: null,
      text: "{T}: Add {C}.",
    },
    {
      cost: { mana: "{2}", tap: true },
      targets: [],
      effect: { kind: "scry", amount: 1 },
      resolve: null,
      text: "{2}, {T}: Scry 1.",
    },
  ],
});
