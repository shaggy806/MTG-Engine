import { defineCard } from "../define.js";

export default defineCard({
  name: "Zhalfirin Void",
  colors: [],
  types: ["land"],
  text: "When this land enters, scry 1. (Look at the top card of your library. You may put that card on the bottom.)\n{T}: Add {C}.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "C", amount: 1 },
      resolve: null,
      text: "{T}: Add {C}.",
    },
  ],
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: { kind: "scry", amount: 1 },
      resolve: null,
      text: "When this land enters, scry 1.",
    },
  ],
});
