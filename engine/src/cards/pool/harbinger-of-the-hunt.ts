import { defineCard } from "../define.js";

export default defineCard({
  name: "Harbinger of the Hunt",
  manaCost: "{3}{R}{G}",
  colors: ["R", "G"],
  types: ["creature"],
  subtypes: ["Dragon"],
  power: 5,
  toughness: 3,
  keywords: ["flying"],
  text:
    "Flying\n" +
    "{2}{R}: This creature deals 1 damage to each creature without flying.\n" +
    "{2}{G}: This creature deals 1 damage to each other creature with flying.",
  activated: [
    {
      cost: { mana: "{2}{R}", tap: false },
      targets: [],
      effect: {
        kind: "damage-all",
        filter: { type: "creature", notKeyword: "flying" },
        amount: 1,
      },
      resolve: null,
      text: "{2}{R}: This creature deals 1 damage to each creature without flying.",
    },
    {
      // "each **other** creature with flying" — the Harbinger has flying
      // itself, so without `exceptSource` it would burn itself down.
      cost: { mana: "{2}{G}", tap: false },
      targets: [],
      effect: {
        kind: "damage-all",
        filter: { type: "creature", keyword: "flying" },
        amount: 1,
        exceptSource: true,
      },
      resolve: null,
      text: "{2}{G}: This creature deals 1 damage to each other creature with flying.",
    },
  ],
});
