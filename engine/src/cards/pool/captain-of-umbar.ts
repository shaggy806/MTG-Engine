import { defineCard } from "../define.js";

export default defineCard({
  name: "Captain of Umbar",
  manaCost: "{2}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Human", "Pirate"],
  power: 2,
  toughness: 3,
  text: "{1}, {T}: Draw a card, then discard a card.",
  activated: [
    {
      cost: { mana: "{1}", tap: true },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [{ kind: "draw", amount: 1 }, { kind: "discard", target: "you", amount: 1 }],
      },
      resolve: null,
      text: "{1}, {T}: Draw a card, then discard a card.",
    },
  ],
});
