import { defineCard } from "../define.js";

// EDHREC rank 2489.
//
// Rulings:
//   [2010-08-15] The effect of Captivating Vampire’s activated ability has no duration. You retain
//     control of the affected creature until the game ends, the creature leaves the battlefield,
//     or a later effect causes someone else to gain control of it. It doesn’t matter whether
//     Captivating Vampire remains on the battlefield. Similarly, the affected creature remains a
//     Vampire in addition to its other types until the game ends, the creature leaves the
//     battlefield, or a later effect changes its types or subtypes.
//   [2010-08-15] Since Captivating Vampire’s activated ability doesn’t have a tap symbol in its
//     cost, you can tap a Vampire (including Captivating Vampire itself) that hasn’t been under
//     your control since your most recent turn began to pay the cost.
//   [2010-08-15] Gaining control of a creature doesn’t cause you gain control of any Auras or
//     Equipment attached to it.
//
// The cost is Gravespawn Sovereign's `tapOthers` (it is itself a Vampire, so
// `includeSelf`); the steal and the Vampire type both last as long as the
// creature stays on the battlefield.

const ANTHEM_TEXT = "Other Vampire creatures you control get +1/+1.";
const STEAL_TEXT =
  "Tap five untapped Vampires you control: Gain control of target creature. It becomes a Vampire in addition to its other types.";

export default defineCard({
  name: "Captivating Vampire",
  manaCost: "{1}{B}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Vampire"],
  power: 2,
  toughness: 2,
  text: `${ANTHEM_TEXT}\n${STEAL_TEXT}`,
  static: [
    {
      affects: { scope: "creatures-you-control", excludeSelf: true, subtype: "Vampire" },
      grantPt: [1, 1],
      text: ANTHEM_TEXT,
    },
  ],
  activated: [
    {
      cost: {
        mana: null,
        tap: false,
        tapOthers: { count: 5, filter: { subtype: "Vampire", controlledBy: "you" }, includeSelf: true },
      },
      targets: ["creature"],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "gain-control", target: 0, untilEndOfTurn: false },
          { kind: "add-types", target: 0, addSubtypes: ["Vampire"], duration: "permanent" },
        ],
      },
      resolve: null,
      text: STEAL_TEXT,
    },
  ],
});
