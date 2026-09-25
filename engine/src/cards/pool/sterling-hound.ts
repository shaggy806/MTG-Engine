import { defineCard } from "../define.js";

export default defineCard({
  name: "Sterling Hound",
  manaCost: "{3}",
  colors: [],
  types: ["artifact", "creature"],
  subtypes: ["Dog"],
  power: 3,
  toughness: 2,
  text: "When this creature enters, surveil 2. (Look at the top two cards of your library, then put any number of them into your graveyard and the rest on top of your library in any order.)",
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
