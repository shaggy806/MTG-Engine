import { defineCard } from "../define.js";
import { manaTapAbility } from "../helpers.js";

// EDHREC rank 2493.
//
// Rulings:
//   [2025-10-02] If one of these lands enters at the same time as any number of basic lands, those
//     other lands are not counted when determining if this land enters tapped or untapped.

const TAPPED_TEXT = "This land enters tapped unless you control a basic land.";

export default defineCard({
  name: "Agna Qel'a",
  colors: [],
  types: ["land"],
  text: `${TAPPED_TEXT}\n{T}: Add {U}.\n{2}{U}, {T}: Draw a card, then discard a card.`,
  static: [
    {
      affects: { scope: "self" },
      replacement: {
        event: "enters-battlefield",
        tappedUnless: { kind: "controls", filter: { supertype: "basic", type: "land" }, atLeast: 1 },
      },
      text: TAPPED_TEXT,
    },
  ],
  activated: [
    manaTapAbility("U"),
    {
      cost: { mana: "{2}{U}", tap: true },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [{ kind: "draw", amount: 1 }, { kind: "discard", target: "you", amount: 1 }],
      },
      resolve: null,
      text: "{2}{U}, {T}: Draw a card, then discard a card.",
    },
  ],
});
