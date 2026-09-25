import { defineCard } from "../define.js";

export default defineCard({
  name: "Energy Refractor",
  manaCost: "{2}",
  colors: [],
  types: ["artifact"],
  text: "When this artifact enters, draw a card.\n{2}: Add one mana of any color.",
  activated: [
    {
      cost: { mana: "{2}", tap: false },
      targets: [],
      effect: { kind: "add-mana", mana: "any-color", amount: 1 },
      resolve: null,
      text: "{2}: Add one mana of any color.",
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
