import { defineCard } from "../define.js";

export default defineCard({
  name: "Memorial to War",
  colors: [],
  types: ["land"],
  text: "This land enters tapped.\n{T}: Add {R}.\n{4}{R}, {T}, Sacrifice this land: Destroy target land.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "R", amount: 1 },
      resolve: null,
      text: "{T}: Add {R}.",
    },
    {
      cost: { mana: "{4}{R}", tap: true, sacrifice: "self" },
      targets: ["land"],
      effect: { kind: "destroy", target: 0 },
      resolve: null,
      text: "{4}{R}, {T}, Sacrifice this land: Destroy target land.",
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
