import { defineCard } from "../define.js";

export default defineCard({
  name: "Memorial to Glory",
  colors: [],
  types: ["land"],
  text: "This land enters tapped.\n{T}: Add {W}.\n{3}{W}, {T}, Sacrifice this land: Create two 1/1 white Soldier creature tokens.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "W", amount: 1 },
      resolve: null,
      text: "{T}: Add {W}.",
    },
    {
      cost: { mana: "{3}{W}", tap: true, sacrifice: "self" },
      targets: [],
      effect: { kind: "create-token", token: "Soldier Token", count: 2 },
      resolve: null,
      text: "{3}{W}, {T}, Sacrifice this land: Create two 1/1 white Soldier creature tokens.",
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
