import { defineCard } from "../define.js";

export default defineCard({
  name: "Kaleidostone",
  manaCost: "{2}",
  colors: [],
  types: ["artifact"],
  text: "When this artifact enters, draw a card.\n{5}, {T}, Sacrifice this artifact: Add {W}{U}{B}{R}{G}.",
  activated: [
    {
      cost: { mana: "{5}", tap: true, sacrifice: "self" },
      targets: [],
      effect: { kind: "add-mana", mana: { all: ["W", "U", "B", "R", "G"] }, amount: 1 },
      resolve: null,
      text: "{5}, {T}, Sacrifice this artifact: Add {W}{U}{B}{R}{G}.",
    },
  ],
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: "When this artifact enters, draw a card.",
    },
  ],
});
