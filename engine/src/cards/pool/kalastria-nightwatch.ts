import { defineCard } from "../define.js";

export default defineCard({
  name: "Kalastria Nightwatch",
  manaCost: "{4}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Vampire", "Warrior", "Ally"],
  power: 4,
  toughness: 5,
  text: "Whenever you gain life, this creature gains flying until end of turn.",
  triggered: [
    {
      trigger: { on: "gains-life", who: "you" },
      targets: [],
      effect: { kind: "grant-keyword", target: "source", keyword: "flying", duration: "end-of-turn" },
      resolve: null,
      text: "Whenever you gain life, this creature gains flying until end of turn.",
    },
  ],
});
