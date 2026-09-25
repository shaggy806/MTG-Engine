import { defineCard } from "../define.js";

export default defineCard({
  name: "Hapless Researcher",
  manaCost: "{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Human", "Wizard"],
  power: 1,
  toughness: 1,
  text: "Sacrifice this creature: Draw a card, then discard a card.",
  activated: [
    {
      cost: { mana: null, tap: false, sacrifice: "self" },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [{ kind: "draw", amount: 1 }, { kind: "discard", target: "you", amount: 1 }],
      },
      resolve: null,
      text: "Sacrifice this creature: Draw a card, then discard a card.",
    },
  ],
});
