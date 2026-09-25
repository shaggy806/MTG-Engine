import { defineCard } from "../define.js";

const LOOT_TEXT = "{2}, {T}: Each player draws a card, then discards a card.";

export default defineCard({
  name: "Geier Reach Sanitarium",
  supertypes: ["legendary"],
  types: ["land"],
  text: `{T}: Add {C}.\n${LOOT_TEXT}`,
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "C", amount: 1 },
      resolve: null,
      text: "{T}: Add {C}.",
    },
    {
      cost: { mana: "{2}", tap: true },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "draw", amount: 1, who: "each-player" },
          { kind: "discard", target: "each-player", amount: 1 },
        ],
      },
      resolve: null,
      text: LOOT_TEXT,
    },
  ],
});
