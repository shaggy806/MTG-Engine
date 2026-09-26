import { defineCard } from "../define.js";

const EXILE_TEXT =
  "{2}, {T}, Sacrifice this artifact: Exile any number of target players' graveyards. Draw a card.";

// Targeting nobody just draws the card (the ruling).
export default defineCard({
  name: "Stonespeaker Crystal",
  manaCost: "{4}",
  colors: [],
  types: ["artifact"],
  text: `{T}: Add {C}{C}.\n${EXILE_TEXT}`,
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "C", amount: 2 },
      resolve: null,
      text: "{T}: Add {C}{C}.",
    },
    {
      cost: { mana: "{2}", tap: true, sacrifice: "self" },
      targets: [{ kind: "any-number", of: "player" }],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "for-each-target", from: 0, effect: { kind: "exile-graveyard", target: 0 }, simultaneous: true },
          { kind: "draw", amount: 1 },
        ],
      },
      resolve: null,
      text: EXILE_TEXT,
    },
  ],
});
