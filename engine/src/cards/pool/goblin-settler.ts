import { defineCard } from "../define.js";

export default defineCard({
  name: "Goblin Settler",
  manaCost: "{3}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Goblin"],
  power: 1,
  toughness: 1,
  text: "When this creature enters, destroy target land.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: ["land"],
      effect: { kind: "destroy", target: 0 },
      resolve: null,
      text: "When this creature enters, destroy target land.",
    },
  ],
});
