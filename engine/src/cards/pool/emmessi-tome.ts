import { defineCard } from "../define.js";

export default defineCard({
  name: "Emmessi Tome",
  manaCost: "{4}",
  colors: [],
  types: ["artifact"],
  subtypes: ["Book"],
  text: "{5}, {T}: Draw two cards, then discard a card.",
  activated: [
    {
      cost: { mana: "{5}", tap: true },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [{ kind: "draw", amount: 2 }, { kind: "discard", target: "you", amount: 1 }],
      },
      resolve: null,
      text: "{5}, {T}: Draw two cards, then discard a card.",
    },
  ],
});
