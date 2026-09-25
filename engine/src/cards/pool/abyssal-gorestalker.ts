import { defineCard } from "../define.js";

export default defineCard({
  name: "Abyssal Gorestalker",
  manaCost: "{4}{B}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Horror"],
  power: 6,
  toughness: 6,
  text: "When this creature enters, each player sacrifices two creatures of their choice.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: { kind: "sacrifice", who: "each-player", filter: { type: "creature" }, count: 2 },
      resolve: null,
      text: "When this creature enters, each player sacrifices two creatures of their choice.",
    },
  ],
});
