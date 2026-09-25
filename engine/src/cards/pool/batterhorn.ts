import { defineCard } from "../define.js";

export default defineCard({
  name: "Batterhorn",
  manaCost: "{4}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Beast"],
  power: 4,
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
