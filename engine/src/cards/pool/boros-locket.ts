import { defineCard } from "../define.js";

export default defineCard({
  name: "Boros Locket",
  manaCost: "{3}",
  colors: [],
  types: ["artifact"],
  text: "{T}: Add {R} or {W}.\n{R/W}{R/W}{R/W}{R/W}, {T}, Sacrifice this artifact: Draw two cards.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: { oneOf: ["R", "W"] }, amount: 1 },
      resolve: null,
      text: "{T}: Add {R} or {W}.",
    },
    {
      cost: { mana: "{R/W}{R/W}{R/W}{R/W}", tap: true, sacrifice: "self" },
      targets: [],
      effect: { kind: "draw", amount: 2 },
      resolve: null,
      text: "{R/W}{R/W}{R/W}{R/W}, {T}, Sacrifice this artifact: Draw two cards.",
    },
  ],
});
