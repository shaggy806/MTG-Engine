import { defineCard } from "../define.js";

export default defineCard({
  name: "Sanitation Automaton",
  manaCost: "{2}",
  colors: [],
  types: ["artifact", "creature"],
  subtypes: ["Construct"],
  power: 2,
  toughness: 1,
  text: "When this creature enters, surveil 1. (Look at the top card of your library. You may put it into your graveyard.)",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: { kind: "surveil", amount: 1 },
      resolve: null,
      text: "When this creature enters, surveil 1.",
    },
  ],
});
