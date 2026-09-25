import { defineCard } from "../define.js";

export default defineCard({
  name: "Polluted Dead",
  manaCost: "{4}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Zombie"],
  power: 3,
  toughness: 3,
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
