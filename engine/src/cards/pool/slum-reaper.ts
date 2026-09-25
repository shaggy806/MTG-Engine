import { defineCard } from "../define.js";

export default defineCard({
  name: "Slum Reaper",
  manaCost: "{3}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Horror"],
  power: 4,
  toughness: 2,
  text: "When this creature enters, each player sacrifices a creature of their choice.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: { kind: "sacrifice", who: "each-player", filter: { type: "creature" }, count: 1 },
      resolve: null,
      text: "When this creature enters, each player sacrifices a creature of their choice.",
    },
  ],
});
