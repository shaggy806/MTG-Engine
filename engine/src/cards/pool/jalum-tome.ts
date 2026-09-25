import { defineCard } from "../define.js";

export default defineCard({
  name: "Jalum Tome",
  manaCost: "{3}",
  colors: [],
  types: ["artifact"],
  subtypes: ["Book"],
  text: "{2}, {T}: Draw a card, then discard a card.",
  activated: [
    {
      cost: { mana: "{2}", tap: true },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [{ kind: "draw", amount: 1 }, { kind: "discard", target: "you", amount: 1 }],
      },
      resolve: null,
      text: "{2}, {T}: Draw a card, then discard a card.",
    },
  ],
});
