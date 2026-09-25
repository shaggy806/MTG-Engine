import { defineCard } from "../define.js";

export default defineCard({
  name: "Seraph Sanctuary",
  colors: [],
  types: ["land"],
  text: "When this land enters, you gain 1 life.\nWhenever an Angel you control enters, you gain 1 life.\n{T}: Add {C}.",
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
      effect: { kind: "gain-life", amount: 1 },
      resolve: null,
      text: "When this land enters, you gain 1 life.",
    },
    {
      trigger: { on: "enters-battlefield", who: "you-control", filter: { subtype: "Angel" } },
      targets: [],
      effect: { kind: "gain-life", amount: 1 },
      resolve: null,
      text: "Whenever an Angel you control enters, you gain 1 life.",
    },
  ],
});
