import { defineCard } from "../define.js";

export default defineCard({
  name: "Bonded Fetch",
  manaCost: "{2}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Homunculus"],
  power: 0,
  toughness: 2,
  keywords: ["defender", "haste"],
  text: "Defender, haste\n{T}: Draw a card, then discard a card.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [{ kind: "draw", amount: 1 }, { kind: "discard", target: "you", amount: 1 }],
      },
      resolve: null,
      text: "{T}: Draw a card, then discard a card.",
    },
  ],
});
