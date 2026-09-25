import { defineCard } from "../define.js";

export default defineCard({
  name: "Bronze Walrus",
  manaCost: "{3}",
  colors: [],
  types: ["artifact", "creature"],
  subtypes: ["Walrus"],
  power: 2,
  toughness: 2,
  text: "When this creature enters, scry 2. (Look at the top two cards of your library, then put any number of them on the bottom and the rest on top in any order.)\n{T}: Add one mana of any color.",
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
      effect: { kind: "scry", amount: 2 },
      resolve: null,
      text: "When this creature enters, scry 2.",
    },
  ],
});
