import { defineCard } from "../define.js";

export default defineCard({
  name: "Goblin Gardener",
  manaCost: "{3}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Goblin"],
  power: 2,
  toughness: 1,
  text: "When this creature dies, destroy target land.",
  triggered: [
    {
      trigger: { on: "dies", who: "self" },
      targets: ["land"],
      effect: { kind: "destroy", target: 0 },
      resolve: null,
      text: "When this creature dies, destroy target land.",
    },
  ],
});
