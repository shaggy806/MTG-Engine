import { defineCard } from "../define.js";

// EDHREC rank 4067.

export default defineCard({
  name: "Shield Sphere",
  manaCost: "{0}",
  colors: [],
  types: ["artifact", "creature"],
  subtypes: ["Wall"],
  power: 0,
  toughness: 6,
  keywords: ["defender"],
  text: "Defender\nWhenever this creature blocks, put a -0/-1 counter on it.",
  triggered: [
    {
      trigger: { on: "blocks", who: "self" },
      targets: [],
      effect: { kind: "add-counter", target: "source", counter: "-0/-1", amount: 1 },
      resolve: null,
      text: "Whenever this creature blocks, put a -0/-1 counter on it.",
    },
  ],
});
