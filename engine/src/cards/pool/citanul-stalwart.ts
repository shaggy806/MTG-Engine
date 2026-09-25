import { defineCard } from "../define.js";

export default defineCard({
  name: "Citanul Stalwart",
  manaCost: "{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Elf", "Druid", "Soldier"],
  power: 1,
  toughness: 1,
  text: "{T}, Tap an untapped artifact or creature you control: Add one mana of any color.",
  activated: [
    {
      cost: {
        mana: null,
        tap: true,
        tapOthers: { count: 1, filter: { typesAnyOf: ["artifact", "creature"], controlledBy: "you" } },
      },
      targets: [],
      effect: { kind: "add-mana", mana: "any-color", amount: 1 },
      resolve: null,
      text: "{T}, Tap an untapped artifact or creature you control: Add one mana of any color.",
    },
  ],
});
