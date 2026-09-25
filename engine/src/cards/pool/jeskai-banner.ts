import { defineCard } from "../define.js";

export default defineCard({
  name: "Jeskai Banner",
  manaCost: "{3}",
  colors: [],
  types: ["artifact"],
  text: "{T}: Add {U}, {R}, or {W}.\n{U}{R}{W}, {T}, Sacrifice this artifact: Draw a card.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: { oneOf: ["U", "R", "W"] }, amount: 1 },
      resolve: null,
      text: "{T}: Add {U}, {R}, or {W}.",
    },
    {
      cost: { mana: "{U}{R}{W}", tap: true, sacrifice: "self" },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: "{U}{R}{W}, {T}, Sacrifice this artifact: Draw a card.",
    },
  ],
});
