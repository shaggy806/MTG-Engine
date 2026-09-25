import { defineCard } from "../define.js";

export default defineCard({
  name: "Centaur Nurturer",
  manaCost: "{3}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Centaur", "Druid"],
  power: 2,
  toughness: 4,
  text: "When this creature enters, you gain 3 life.\n{T}: Add one mana of any color.",
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
      effect: { kind: "gain-life", amount: 3 },
      resolve: null,
      text: "When this creature enters, you gain 3 life.",
    },
  ],
});
