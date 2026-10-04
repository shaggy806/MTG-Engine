import { defineCard } from "../define.js";
import { ward } from "../helpers.js";

// EDHREC rank 3467.
//
// Rulings:
//   [2023-10-13] The Doctor's companion ability allows you to have two commanders if one has the
//     ability and the other is a legendary creature that is a Time Lord Doctor and has no other
//     creature types. Creatures with the changeling ability, for example, can't be a second
//     commander this way.

const WARD_TEXT = "Negative — As long as K-9 is untapped, other legendary creatures you control have ward {1}.";
const UNBLOCKABLE_TEXT = "Affirmative — {1}{U}, {T}: Target legendary creature can't be blocked this turn.";

export default defineCard({
  name: "K-9, Mark I",
  manaCost: "{U}",
  colors: ["U"],
  supertypes: ["legendary"],
  types: ["artifact", "creature"],
  subtypes: ["Robot", "Dog"],
  power: 1,
  toughness: 1,
  pairing: { kind: "doctors-companion" },
  text: `${WARD_TEXT}\n${UNBLOCKABLE_TEXT}\nDoctor's companion (You can have two commanders if the other is the Doctor.)`,
  static: [
    {
      affects: {
        scope: "filter",
        filter: { type: "creature", supertype: "legendary", controlledBy: "you" },
        excludeSelf: true,
      },
      condition: { kind: "source", filter: { tapped: false } },
      grantsTriggered: [ward({ mana: "{1}" })],
      text: WARD_TEXT,
    },
  ],
  activated: [
    {
      cost: { mana: "{1}{U}", tap: true },
      targets: [{ kind: "permanent", filter: { type: "creature", supertype: "legendary" } }],
      effect: { kind: "grant-keyword", target: 0, keyword: "unblockable", duration: "end-of-turn" },
      resolve: null,
      text: UNBLOCKABLE_TEXT,
    },
  ],
});
