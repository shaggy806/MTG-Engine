import { defineCard } from "../define.js";

export default defineCard({
  name: "Orochi Leafcaller",
  manaCost: "{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Snake", "Shaman"],
  power: 1,
  toughness: 1,
  text: "{G}: Add one mana of any color.",
  activated: [
    {
      cost: { mana: "{G}", tap: false },
      targets: [],
      effect: { kind: "add-mana", mana: "any-color", amount: 1 },
      resolve: null,
      text: "{G}: Add one mana of any color.",
    },
  ],
});
