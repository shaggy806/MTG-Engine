import { defineCard } from "../define.js";

export default defineCard({
  name: "Nomadic Elf",
  manaCost: "{1}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Elf", "Nomad"],
  power: 2,
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
