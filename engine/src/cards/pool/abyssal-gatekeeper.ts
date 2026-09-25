import { defineCard } from "../define.js";

export default defineCard({
  name: "Abyssal Gatekeeper",
  manaCost: "{1}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Horror"],
  power: 1,
  toughness: 1,
  text: "When this creature dies, each player sacrifices a creature of their choice.",
  triggered: [
    {
      trigger: { on: "dies", who: "self" },
      targets: [],
      effect: { kind: "sacrifice", who: "each-player", filter: { type: "creature" }, count: 1 },
      resolve: null,
      text: "When this creature dies, each player sacrifices a creature of their choice.",
    },
  ],
});
