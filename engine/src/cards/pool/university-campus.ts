import { defineCard } from "../define.js";

export default defineCard({
  name: "University Campus",
  colors: [],
  types: ["land"],
  text: "This land enters tapped.\n{T}: Add {W} or {U}.\n{4}, {T}: Surveil 1. (Look at the top card of your library. You may put it into your graveyard.)",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: { oneOf: ["W", "U"] }, amount: 1 },
      resolve: null,
      text: "{T}: Add {W} or {U}.",
    },
    {
      cost: { mana: "{4}", tap: true },
      targets: [],
      effect: { kind: "surveil", amount: 1 },
      resolve: null,
      text: "{4}, {T}: Surveil 1.",
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
