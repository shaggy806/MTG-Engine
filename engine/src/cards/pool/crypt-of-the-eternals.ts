import { defineCard } from "../define.js";

export default defineCard({
  name: "Crypt of the Eternals",
  colors: [],
  types: ["land"],
  text: "When this land enters, you gain 1 life.\n{T}: Add {C}.\n{1}, {T}: Add {U}, {B}, or {R}.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "C", amount: 1 },
      resolve: null,
      text: "{T}: Add {C}.",
    },
    {
      cost: { mana: "{1}", tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: { oneOf: ["U", "B", "R"] }, amount: 1 },
      resolve: null,
      text: "{1}, {T}: Add {U}, {B}, or {R}.",
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
});
