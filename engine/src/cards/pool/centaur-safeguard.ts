import { defineCard } from "../define.js";

export default defineCard({
  name: "Centaur Safeguard",
  manaCost: "{2}{G/W}",
  colors: ["W", "G"],
  types: ["creature"],
  subtypes: ["Centaur", "Warrior"],
  power: 3,
  toughness: 1,
  text: "({G/W} can be paid with either {G} or {W}.)\nWhen this creature dies, you may gain 3 life.",
  triggered: [
    {
      trigger: { on: "dies", who: "self" },
      targets: [],
      effect: { kind: "may", prompt: "Gain 3 life?", effect: { kind: "gain-life", amount: 3 } },
      resolve: null,
      text: "When this creature dies, you may gain 3 life.",
    },
  ],
});
