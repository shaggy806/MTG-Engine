import { defineCard } from "../define.js";

export default defineCard({
  name: "Piranha Marsh",
  colors: [],
  types: ["land"],
  text: "This land enters tapped.\nWhen this land enters, target player loses 1 life.\n{T}: Add {B}.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "B", amount: 1 },
      resolve: null,
      text: "{T}: Add {B}.",
    },
  ],
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: ["player"],
      effect: { kind: "lose-life", amount: 1, target: 0 },
      resolve: null,
      text: "When this land enters, target player loses 1 life.",
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
