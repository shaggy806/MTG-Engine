import { defineCard } from "../define.js";
import { equip, ward } from "../helpers.js";

// EDHREC rank 6248.
//
// Rulings:
//   [2024-07-05] If either creature is an illegal target as Hunter's Bow's first ability tries to
//     resolve, the creature you control won't deal damage.


const ENTER_TEXT =
  "When this Equipment enters, attach it to target creature you control. That creature deals damage equal to its power to up to one target creature you don't control.";
const STATIC_TEXT = "Equipped creature has reach and ward {2}.";

// Maul of the Skyclaves' attach, then Bite Down's one-sided fight, which
// needs both slots (the ruling: either target illegal, no damage). "You
// don't control" is an opponent's: a free-for-all table has no teammates.
export default defineCard({
  name: "Hunter's Bow",
  manaCost: "{1}{G}",
  colors: ["G"],
  types: ["artifact"],
  subtypes: ["Equipment"],
  text: `${ENTER_TEXT}\n${STATIC_TEXT}\nEquip {1}`,
  activated: [equip("{1}")],
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: ["creature-you-control", { kind: "optional", of: "creature-an-opponent-controls" }],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "attach", target: 0, attachment: "source" },
          { kind: "fight", a: 0, b: 1, oneSided: true },
        ],
      },
      resolve: null,
      text: ENTER_TEXT,
    },
  ],
  static: [
    {
      affects: { scope: "attached" },
      grantKeywords: ["reach"],
      grantsTriggered: [ward({ mana: "{2}" })],
      text: STATIC_TEXT,
    },
  ],
});
