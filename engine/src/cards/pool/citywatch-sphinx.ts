import { defineCard } from "../define.js";

export default defineCard({
  name: "Citywatch Sphinx",
  manaCost: "{5}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Sphinx"],
  power: 5,
  toughness: 4,
  keywords: ["flying"],
  text: "Flying\nWhen this creature dies, surveil 2. (Look at the top two cards of your library, then put any number of them into your graveyard and the rest on top of your library in any order.)",
  triggered: [
    {
      trigger: { on: "dies", who: "self" },
      targets: [],
      effect: { kind: "surveil", amount: 2 },
      resolve: null,
      text: "When this creature dies, surveil 2.",
    },
  ],
});
