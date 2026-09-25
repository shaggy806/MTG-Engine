import { defineCard } from "../define.js";

export default defineCard({
  name: "Seton, Krosan Protector",
  manaCost: "{G}{G}{G}",
  colors: ["G"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Centaur", "Druid"],
  power: 2,
  toughness: 2,
  text: "Tap an untapped Druid you control: Add {G}.",
  activated: [
    {
      cost: {
        mana: null,
        tap: false,
        tapOthers: { count: 1, filter: { subtype: "Druid", controlledBy: "you" }, includeSelf: true },
      },
      targets: [],
      effect: { kind: "add-mana", mana: "G", amount: 1 },
      resolve: null,
      text: "Tap an untapped Druid you control: Add {G}.",
    },
  ],
});
