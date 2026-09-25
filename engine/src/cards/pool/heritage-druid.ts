import { defineCard } from "../define.js";

export default defineCard({
  name: "Heritage Druid",
  manaCost: "{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Elf", "Druid"],
  power: 1,
  toughness: 1,
  text: "Tap three untapped Elves you control: Add {G}{G}{G}.",
  activated: [
    {
      cost: {
        mana: null,
        tap: false,
        tapOthers: { count: 3, filter: { subtype: "Elf", controlledBy: "you" }, includeSelf: true },
      },
      targets: [],
      effect: { kind: "add-mana", mana: "G", amount: 3 },
      resolve: null,
      text: "Tap three untapped Elves you control: Add {G}{G}{G}.",
    },
  ],
});
