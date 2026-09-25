import { defineCard } from "../define.js";

export default defineCard({
  name: "Wild Celebrants",
  manaCost: "{3}{R}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Satyr"],
  power: 5,
  toughness: 3,
  text: "When this creature enters, you may destroy target artifact.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: ["artifact"],
      effect: {
        kind: "may",
        prompt: "Destroy target artifact?",
        effect: { kind: "destroy", target: 0 },
      },
      resolve: null,
      text: "When this creature enters, you may destroy target artifact.",
    },
  ],
});
