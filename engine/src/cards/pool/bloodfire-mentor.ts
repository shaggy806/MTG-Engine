import { defineCard } from "../define.js";

export default defineCard({
  name: "Bloodfire Mentor",
  manaCost: "{2}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Efreet", "Shaman"],
  power: 0,
  toughness: 5,
  text: "{2}{U}, {T}: Draw a card, then discard a card.",
  activated: [
    {
      cost: { mana: "{2}{U}", tap: true },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [{ kind: "draw", amount: 1 }, { kind: "discard", target: "you", amount: 1 }],
      },
      resolve: null,
      text: "{2}{U}, {T}: Draw a card, then discard a card.",
    },
  ],
});
