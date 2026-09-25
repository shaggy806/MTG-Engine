import { defineCard } from "../define.js";

export default defineCard({
  name: "Merciless Executioner",
  manaCost: "{2}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Orc", "Warrior"],
  power: 3,
  toughness: 1,
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
