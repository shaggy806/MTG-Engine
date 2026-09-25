import { defineCard } from "../define.js";

export default defineCard({
  name: "Tinder Farm",
  colors: [],
  types: ["land"],
  text: "This land enters tapped.\n{T}: Add {G}.\n{T}, Sacrifice this land: Add {R}{W}.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "G", amount: 1 },
      resolve: null,
      text: "{T}: Add {G}.",
    },
    {
      cost: { mana: null, tap: true, sacrifice: "self" },
      targets: [],
      effect: { kind: "add-mana", mana: { all: ["R", "W"] }, amount: 1 },
      resolve: null,
      text: "{T}, Sacrifice this land: Add {R}{W}.",
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
