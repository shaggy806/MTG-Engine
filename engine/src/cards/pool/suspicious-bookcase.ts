import { defineCard } from "../define.js";

// EDHREC rank 5084.
//
// Rulings:
//   [2018-07-13] Activating Suspicious Bookcase's ability after a creature has become blocked
//     won't cause that creature to become unblocked.

const UNBLOCKABLE_TEXT = "{3}, {T}: Target creature can't be blocked this turn.";

export default defineCard({
  name: "Suspicious Bookcase",
  manaCost: "{2}",
  colors: [],
  types: ["artifact", "creature"],
  subtypes: ["Wall"],
  power: 0,
  toughness: 4,
  keywords: ["defender"],
  text: `Defender\n${UNBLOCKABLE_TEXT}`,
  activated: [
    {
      cost: { mana: "{3}", tap: true },
      targets: ["creature"],
      effect: { kind: "grant-keyword", target: 0, keyword: "unblockable", duration: "end-of-turn" },
      resolve: null,
      text: UNBLOCKABLE_TEXT,
    },
  ],
});
