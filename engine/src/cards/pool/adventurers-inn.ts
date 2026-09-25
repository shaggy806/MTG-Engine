import { defineCard } from "../define.js";

export default defineCard({
  name: "Adventurer's Inn",
  colors: [],
  types: ["land"],
  subtypes: ["Town"],
  text: "When this land enters, you gain 2 life.\n{T}: Add {C}.",
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
      effect: { kind: "gain-life", amount: 2 },
      resolve: null,
      text: "When this land enters, you gain 2 life.",
    },
  ],
});
