import { defineCard } from "../define.js";

export default defineCard({
  name: "Akki Blizzard-Herder",
  manaCost: "{1}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Goblin", "Shaman"],
  power: 1,
  toughness: 1,
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
