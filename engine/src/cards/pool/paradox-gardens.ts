import { defineCard } from "../define.js";

export default defineCard({
  name: "Paradox Gardens",
  colors: [],
  types: ["land"],
  text: "This land enters tapped.\n{T}: Add {G} or {U}.\n{2}{G}{U}, {T}: Surveil 1. (Look at the top card of your library. You may put it into your graveyard.)",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: { oneOf: ["G", "U"] }, amount: 1 },
      resolve: null,
      text: "{T}: Add {G} or {U}.",
    },
    {
      cost: { mana: "{2}{G}{U}", tap: true },
      targets: [],
      effect: { kind: "surveil", amount: 1 },
      resolve: null,
      text: "{2}{G}{U}, {T}: Surveil 1.",
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
