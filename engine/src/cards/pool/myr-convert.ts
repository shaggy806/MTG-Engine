import { defineCard } from "../define.js";

export default defineCard({
  name: "Myr Convert",
  manaCost: "{2}",
  colors: [],
  types: ["artifact", "creature"],
  subtypes: ["Phyrexian", "Myr"],
  power: 2,
  toughness: 1,
  toxic: 1,
  text:
    "Toxic 1 (Players dealt combat damage by this creature also get a poison counter.)\n" +
    "{T}, Pay 2 life: Add one mana of any color.",
  activated: [
    {
      cost: { mana: null, tap: true, payLife: 2 },
      targets: [],
      effect: { kind: "add-mana", mana: "any-color", amount: 1 },
      resolve: null,
      text: "{T}, Pay 2 life: Add one mana of any color.",
    },
  ],
});
