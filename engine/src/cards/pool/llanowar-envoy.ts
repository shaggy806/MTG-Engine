import { defineCard } from "../define.js";

export default defineCard({
  name: "Llanowar Envoy",
  manaCost: "{2}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Elf", "Scout"],
  power: 3,
  toughness: 2,
  text: "{1}{G}: Add one mana of any color.",
  activated: [
    {
      cost: { mana: "{1}{G}", tap: false },
      targets: [],
      effect: { kind: "add-mana", mana: "any-color", amount: 1 },
      resolve: null,
      text: "{1}{G}: Add one mana of any color.",
    },
  ],
});
