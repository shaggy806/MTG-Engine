import { defineCard } from "../define.js";

export default defineCard({
  name: "Magus of the Bazaar",
  manaCost: "{1}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Human", "Wizard"],
  power: 0,
  toughness: 1,
  text: "{T}: Draw two cards, then discard three cards.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [{ kind: "draw", amount: 2 }, { kind: "discard", target: "you", amount: 3 }],
      },
      resolve: null,
      text: "{T}: Draw two cards, then discard three cards.",
    },
  ],
});
