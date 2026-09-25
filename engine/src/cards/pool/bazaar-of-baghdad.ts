import { defineCard } from "../define.js";

export default defineCard({
  name: "Bazaar of Baghdad",
  colors: [],
  types: ["land"],
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
