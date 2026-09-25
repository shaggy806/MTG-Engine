import { defineCard } from "../define.js";

export default defineCard({
  name: "Ravenous Baloth",
  manaCost: "{2}{G}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Beast"],
  power: 4,
  toughness: 4,
  text: "Sacrifice a Beast: You gain 4 life.",
  activated: [
    {
      cost: { mana: null, tap: false, sacrifice: { filter: { subtype: "Beast" } } },
      targets: [],
      effect: { kind: "gain-life", amount: 4 },
      resolve: null,
      text: "Sacrifice a Beast: You gain 4 life.",
    },
  ],
});
