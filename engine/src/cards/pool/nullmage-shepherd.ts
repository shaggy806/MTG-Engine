import { defineCard } from "../define.js";

export default defineCard({
  name: "Nullmage Shepherd",
  manaCost: "{3}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Elf", "Shaman"],
  power: 2,
  toughness: 4,
  text: "Tap four untapped creatures you control: Destroy target artifact or enchantment.",
  activated: [
    {
      cost: {
        mana: null,
        tap: false,
        tapOthers: {
          count: 4,
          filter: { type: "creature", controlledBy: "you" },
          includeSelf: true,
        },
      },
      targets: ["artifact-or-enchantment"],
      effect: { kind: "destroy", target: 0 },
      resolve: null,
      text: "Tap four untapped creatures you control: Destroy target artifact or enchantment.",
    },
  ],
});
