import { defineCard } from "../define.js";

export default defineCard({
  name: "Mana Geode",
  manaCost: "{3}",
  colors: [],
  types: ["artifact"],
  text: "When this artifact enters, scry 1.\n{T}: Add one mana of any color.",
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
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: { kind: "scry", amount: 1 },
      resolve: null,
      text: "When this artifact enters, scry 1.",
    },
  ],
});
