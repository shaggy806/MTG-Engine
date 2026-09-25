import { defineCard } from "../define.js";

export default defineCard({
  name: "Hurloon Shaman",
  manaCost: "{1}{R}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Minotaur", "Shaman"],
  power: 2,
  toughness: 3,
  text: "When this creature dies, each player sacrifices a land of their choice.",
  triggered: [
    {
      trigger: { on: "dies", who: "self" },
      targets: [],
      effect: { kind: "sacrifice", who: "each-player", filter: { type: "land" }, count: 1 },
      resolve: null,
      text: "When this creature dies, each player sacrifices a land of their choice.",
    },
  ],
});
