import { defineCard } from "../define.js";

const TEXT = "{T}: Add {G} for each creature you control.";

export default defineCard({
  name: "Circle of Dreams Druid",
  manaCost: "{G}{G}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Elf", "Druid"],
  power: 2,
  toughness: 1,
  text: TEXT,
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "G", amount: { countOf: { type: "creature", controlledBy: "you" } } },
      resolve: null,
      text: TEXT,
    },
  ],
});
