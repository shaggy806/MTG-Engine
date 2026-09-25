import { defineCard } from "../define.js";

export default defineCard({
  name: "A.I.M. Labs",
  colors: [],
  types: ["land"],
  text: "This land enters tapped.\nWhen this land enters, you gain 1 life.\n{T}: Add {U} or {B}.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: { oneOf: ["U", "B"] }, amount: 1 },
      resolve: null,
      text: "{T}: Add {U} or {B}.",
    },
  ],
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: { kind: "gain-life", amount: 1 },
      resolve: null,
      text: "When this land enters, you gain 1 life.",
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
