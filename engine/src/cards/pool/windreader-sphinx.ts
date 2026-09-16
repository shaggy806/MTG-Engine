import { defineCard } from "../define.js";

export default defineCard({
  name: "Windreader Sphinx",
  manaCost: "{5}{U}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Sphinx"],
  power: 3,
  toughness: 7,
  keywords: ["flying"],
  text: "Flying\nWhenever a creature with flying attacks, you may draw a card.",
  triggered: [
    {
      // "**a** creature" — anyone's, including your own attackers.
      trigger: { on: "attacks", who: "any", filter: { keyword: "flying" } },
      targets: [],
      effect: { kind: "may", prompt: "Draw a card?", effect: { kind: "draw", amount: 1 } },
      resolve: null,
      text: "Whenever a creature with flying attacks, you may draw a card.",
    },
  ],
});
