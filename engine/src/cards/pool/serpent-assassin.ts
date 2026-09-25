import { defineCard } from "../define.js";

export default defineCard({
  name: "Serpent Assassin",
  manaCost: "{3}{B}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Snake", "Assassin"],
  power: 2,
  toughness: 2,
  text: "When this creature enters, you may destroy target nonblack creature.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: ["nonblack-creature"],
      effect: {
        kind: "may",
        prompt: "Destroy target nonblack creature?",
        effect: { kind: "destroy", target: 0 },
      },
      resolve: null,
      text: "When this creature enters, you may destroy target nonblack creature.",
    },
  ],
});
