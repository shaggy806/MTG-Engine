import { defineCard } from "../define.js";

export default defineCard({
  name: "Azorius Locket",
  manaCost: "{3}",
  colors: [],
  types: ["artifact"],
  text: "{T}: Add {W} or {U}.\n{W/U}{W/U}{W/U}{W/U}, {T}, Sacrifice this artifact: Draw two cards.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: { oneOf: ["W", "U"] }, amount: 1 },
      resolve: null,
      text: "{T}: Add {W} or {U}.",
    },
    {
      cost: { mana: "{W/U}{W/U}{W/U}{W/U}", tap: true, sacrifice: "self" },
      targets: [],
      effect: { kind: "draw", amount: 2 },
      resolve: null,
      text: "{W/U}{W/U}{W/U}{W/U}, {T}, Sacrifice this artifact: Draw two cards.",
    },
  ],
});
