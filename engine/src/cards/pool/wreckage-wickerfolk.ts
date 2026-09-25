import { defineCard } from "../define.js";

export default defineCard({
  name: "Wreckage Wickerfolk",
  manaCost: "{1}{B}",
  colors: ["B"],
  types: ["artifact", "creature"],
  subtypes: ["Scarecrow"],
  power: 1,
  toughness: 3,
  keywords: ["flying"],
  text: "Flying\nWhen this creature enters, surveil 2. (Look at the top two cards of your library, then put any number of them into your graveyard and the rest on top of your library in any order.)",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: { kind: "surveil", amount: 2 },
      resolve: null,
      text: "When this creature enters, surveil 2.",
    },
  ],
});
