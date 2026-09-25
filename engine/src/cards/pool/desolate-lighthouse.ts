import { defineCard } from "../define.js";

export default defineCard({
  name: "Desolate Lighthouse",
  colors: [],
  types: ["land"],
  text: "{T}: Add {C}.\n{1}{U}{R}, {T}: Draw a card, then discard a card.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "C", amount: 1 },
      resolve: null,
      text: "{T}: Add {C}.",
    },
    {
      cost: { mana: "{1}{U}{R}", tap: true },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [{ kind: "draw", amount: 1 }, { kind: "discard", target: "you", amount: 1 }],
      },
      resolve: null,
      text: "{1}{U}{R}, {T}: Draw a card, then discard a card.",
    },
  ],
});
