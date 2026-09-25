import { defineCard } from "../define.js";

export default defineCard({
  name: "Viridian Zealot",
  manaCost: "{G}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Elf", "Warrior"],
  power: 2,
  toughness: 1,
  text: "{1}{G}, Sacrifice this creature: Destroy target artifact or enchantment.",
  activated: [
    {
      cost: { mana: "{1}{G}", tap: false, sacrifice: "self" },
      targets: ["artifact-or-enchantment"],
      effect: { kind: "destroy", target: 0 },
      resolve: null,
      text: "{1}{G}, Sacrifice this creature: Destroy target artifact or enchantment.",
    },
  ],
});
