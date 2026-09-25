import { defineCard } from "../define.js";

export default defineCard({
  name: "Spectacle Summit",
  colors: [],
  types: ["land"],
  text: "This land enters tapped.\n{T}: Add {U} or {R}.\n{2}{U}{R}, {T}: Surveil 1. (Look at the top card of your library. You may put it into your graveyard.)",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: { oneOf: ["U", "R"] }, amount: 1 },
      resolve: null,
      text: "{T}: Add {U} or {R}.",
    },
    {
      cost: { mana: "{2}{U}{R}", tap: true },
      targets: [],
      effect: { kind: "surveil", amount: 1 },
      resolve: null,
      text: "{2}{U}{R}, {T}: Surveil 1.",
    },
  ],
  static: [
    {
      affects: { scope: "self" },
      replacement: { event: "enters-battlefield", tapped: true },
      text: "This land enters tapped.",
    },
  ],
});
