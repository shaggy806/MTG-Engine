import { defineCard } from "../define.js";

export default defineCard({
  name: "Team Transmitter",
  manaCost: "{3}",
  colors: [],
  types: ["artifact"],
  text: "Whenever a Hero you control enters, you gain 1 life.\n{T}: Add one mana of any color.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "any-color", amount: 1 },
      resolve: null,
      text: "{T}: Add one mana of any color.",
    },
  ],
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "you-control", filter: { subtype: "Hero" } },
      targets: [],
      effect: { kind: "gain-life", amount: 1 },
      resolve: null,
      text: "Whenever a Hero you control enters, you gain 1 life.",
    },
  ],
});
