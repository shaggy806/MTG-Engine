import { defineCard } from "../define.js";

export default defineCard({
  name: "Teferi's Protege",
  manaCost: "{2}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Human", "Wizard"],
  power: 2,
  toughness: 3,
  text: "{1}{U}, {T}: Draw a card, then discard a card.",
  activated: [
    {
      cost: { mana: "{1}{U}", tap: true },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [{ kind: "draw", amount: 1 }, { kind: "discard", target: "you", amount: 1 }],
      },
      resolve: null,
      text: "{1}{U}, {T}: Draw a card, then discard a card.",
    },
  ],
});
