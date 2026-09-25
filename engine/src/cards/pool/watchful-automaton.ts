import { defineCard } from "../define.js";

export default defineCard({
  name: "Watchful Automaton",
  manaCost: "{3}",
  colors: [],
  types: ["artifact", "creature"],
  subtypes: ["Construct"],
  power: 2,
  toughness: 2,
  text: "{2}{U}: Scry 1. (Look at the top card of your library. You may put that card on the bottom.)",
  activated: [
    {
      cost: { mana: "{2}{U}", tap: false },
      targets: [],
      effect: { kind: "scry", amount: 1 },
      resolve: null,
      text: "{2}{U}: Scry 1.",
    },
  ],
});
