import { defineCard } from "../define.js";

export default defineCard({
  name: "Rith's Attendant",
  manaCost: "{5}",
  colors: [],
  types: ["artifact", "creature"],
  subtypes: ["Golem"],
  power: 3,
  toughness: 3,
  text: "{1}, Sacrifice this creature: Add {R}{G}{W}.",
  activated: [
    {
      cost: { mana: "{1}", tap: false, sacrifice: "self" },
      targets: [],
      effect: { kind: "add-mana", mana: { all: ["R", "G", "W"] }, amount: 1 },
      resolve: null,
      text: "{1}, Sacrifice this creature: Add {R}{G}{W}.",
    },
  ],
});
