import { defineCard } from "../define.js";

export default defineCard({
  name: "Tidespout Tyrant",
  manaCost: "{5}{U}{U}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Djinn"],
  power: 5,
  toughness: 5,
  keywords: ["flying"],
  text: "Flying\nWhenever you cast a spell, return target permanent to its owner's hand.",
  triggered: [
    {
      trigger: { on: "cast-spell", who: "you" },
      targets: ["permanent"],
      effect: { kind: "return-to-hand", target: 0 },
      resolve: null,
      text: "Whenever you cast a spell, return target permanent to its owner's hand.",
    },
  ],
});
