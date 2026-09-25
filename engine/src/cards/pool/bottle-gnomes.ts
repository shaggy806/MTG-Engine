import { defineCard } from "../define.js";

export default defineCard({
  name: "Bottle Gnomes",
  manaCost: "{3}",
  colors: [],
  types: ["artifact", "creature"],
  subtypes: ["Gnome"],
  power: 1,
  toughness: 3,
  text: "Sacrifice this creature: You gain 3 life.",
  activated: [
    {
      cost: { mana: null, tap: false, sacrifice: "self" },
      targets: [],
      effect: { kind: "gain-life", amount: 3 },
      resolve: null,
      text: "Sacrifice this creature: You gain 3 life.",
    },
  ],
});
