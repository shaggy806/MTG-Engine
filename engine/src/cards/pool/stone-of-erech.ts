import { defineCard } from "../define.js";

// EDHREC rank 3563.
//
// Rulings:
//   [2023-06-16] Because creatures controlled by opponents aren't being put into a graveyard, any
//     "when [this creature] dies" triggered abilities those creatures have won't trigger.
//   [2023-06-16] If the target is not legal as Stone of Erech's activated ability tries to
//     resolve, the ability is removed from the stack. You won't draw a card.
//
// The replacement is Vren, the Relentless's dies-only graveyard replacement.

const EXILE_TEXT = "If a creature an opponent controls would die, exile it instead.";
const SAC_TEXT = "{2}, {T}, Sacrifice Stone of Erech: Exile target player's graveyard. Draw a card.";

export default defineCard({
  name: "Stone of Erech",
  manaCost: "{1}",
  colors: [],
  supertypes: ["legendary"],
  types: ["artifact"],
  text: `${EXILE_TEXT}\n${SAC_TEXT}`,
  static: [
    {
      affects: { scope: "self" },
      replacement: {
        event: "would-be-put-into-graveyard",
        instead: "exile",
        from: "battlefield",
        filter: { type: "creature", controlledBy: "opponent" },
      },
      text: EXILE_TEXT,
    },
  ],
  activated: [
    {
      cost: { mana: "{2}", tap: true, sacrifice: "self" },
      targets: ["player"],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "exile-graveyard", target: 0 },
          { kind: "draw", amount: 1 },
        ],
      },
      resolve: null,
      text: SAC_TEXT,
    },
  ],
});
