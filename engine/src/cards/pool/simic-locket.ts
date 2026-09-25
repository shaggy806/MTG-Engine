import { defineCard } from "../define.js";

export default defineCard({
  name: "Simic Locket",
  manaCost: "{3}",
  colors: [],
  types: ["artifact"],
  text: "{T}: Add {G} or {U}.\n{G/U}{G/U}{G/U}{G/U}, {T}, Sacrifice this artifact: Draw two cards.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: { oneOf: ["G", "U"] }, amount: 1 },
      resolve: null,
      text: "{T}: Add {G} or {U}.",
    },
    {
      cost: { mana: "{G/U}{G/U}{G/U}{G/U}", tap: true, sacrifice: "self" },
      targets: [],
      effect: { kind: "draw", amount: 2 },
      resolve: null,
      text: "{G/U}{G/U}{G/U}{G/U}, {T}, Sacrifice this artifact: Draw two cards.",
    },
  ],
});
