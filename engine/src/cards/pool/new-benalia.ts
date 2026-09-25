import { defineCard } from "../define.js";

export default defineCard({
  name: "New Benalia",
  colors: [],
  types: ["land"],
  text: "This land enters tapped.\nWhen this land enters, scry 1. (Look at the top card of your library. You may put that card on the bottom.)\n{T}: Add {W}.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "W", amount: 1 },
      resolve: null,
      text: "{T}: Add {W}.",
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
  static: [
    {
      affects: { scope: "self" },
      replacement: { event: "enters-battlefield", tapped: true },
      text: "This land enters tapped.",
    },
  ],
});
