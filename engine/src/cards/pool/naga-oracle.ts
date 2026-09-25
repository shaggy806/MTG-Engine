import { defineCard } from "../define.js";

export default defineCard({
  name: "Naga Oracle",
  manaCost: "{3}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Snake", "Cleric"],
  power: 2,
  toughness: 4,
  text: "When this creature enters, surveil 3. (Look at the top three cards of your library, then put any number of them into your graveyard and the rest on top of your library in any order.)",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: { kind: "surveil", amount: 3 },
      resolve: null,
      text: "When this creature enters, surveil 3.",
    },
  ],
});
