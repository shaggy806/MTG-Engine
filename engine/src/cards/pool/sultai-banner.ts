import { defineCard } from "../define.js";

export default defineCard({
  name: "Sultai Banner",
  manaCost: "{3}",
  colors: [],
  types: ["artifact"],
  text: "{T}: Add {B}, {G}, or {U}.\n{B}{G}{U}, {T}, Sacrifice this artifact: Draw a card.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: { oneOf: ["B", "G", "U"] }, amount: 1 },
      resolve: null,
      text: "{T}: Add {B}, {G}, or {U}.",
    },
    {
      cost: { mana: "{B}{G}{U}", tap: true, sacrifice: "self" },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: "{B}{G}{U}, {T}, Sacrifice this artifact: Draw a card.",
    },
  ],
});
