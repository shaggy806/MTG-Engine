import { defineCard } from "../define.js";

export default defineCard({
  name: "Research Assistant",
  manaCost: "{1}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Human", "Wizard"],
  power: 1,
  toughness: 3,
  text: "{3}{U}, {T}: Draw a card, then discard a card.",
  activated: [
    {
      cost: { mana: "{3}{U}", tap: true },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [{ kind: "draw", amount: 1 }, { kind: "discard", target: "you", amount: 1 }],
      },
      resolve: null,
      text: "{3}{U}, {T}: Draw a card, then discard a card.",
    },
  ],
});
