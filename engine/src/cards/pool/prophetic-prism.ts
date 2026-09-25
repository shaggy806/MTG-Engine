import { defineCard } from "../define.js";

export default defineCard({
  name: "Prophetic Prism",
  manaCost: "{2}",
  colors: [],
  types: ["artifact"],
  text: "When this artifact enters, draw a card.\n{1}, {T}: Add one mana of any color.",
  activated: [
    {
      cost: { mana: "{1}", tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "any-color", amount: 1 },
      resolve: null,
      text: "{1}, {T}: Add one mana of any color.",
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
