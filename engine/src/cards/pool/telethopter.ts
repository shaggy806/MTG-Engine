import { defineCard } from "../define.js";

export default defineCard({
  name: "Telethopter",
  manaCost: "{4}",
  colors: [],
  types: ["artifact", "creature"],
  subtypes: ["Thopter"],
  power: 3,
  toughness: 1,
  text: "Tap an untapped creature you control: This creature gains flying until end of turn.",
  activated: [
    {
      cost: {
        mana: null,
        tap: false,
        tapOthers: { count: 1, filter: { type: "creature", controlledBy: "you" }, includeSelf: true },
      },
      targets: [],
      effect: { kind: "grant-keyword", target: "source", keyword: "flying", duration: "end-of-turn" },
      resolve: null,
      text: "Tap an untapped creature you control: This creature gains flying until end of turn.",
    },
  ],
});
