import { defineCard } from "../define.js";

export default defineCard({
  name: "Atraxa, Praetors' Voice",
  manaCost: "{G}{W}{U}{B}",
  colors: ["G", "W", "U", "B"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Phyrexian", "Angel", "Horror"],
  power: 4,
  toughness: 4,
  keywords: ["flying", "vigilance", "deathtouch", "lifelink"],
  text: "Flying, vigilance, deathtouch, lifelink\nAt the beginning of your end step, proliferate.",
  triggered: [
    {
      trigger: { on: "step-begins", step: "end", who: "you" },
      targets: [],
      effect: { kind: "proliferate" },
      resolve: null,
      text: "At the beginning of your end step, proliferate.",
    },
  ],
});
