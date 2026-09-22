import { defineCard } from "../define.js";

// #403 in top-commanders.txt. Two clauses, both existing vocabulary:
//
// - "Other Mice you control get +1/+1." — Goblin Chieftain's lord shape
//   (`creatures-you-control` + `subtype` + `excludeSelf`). Mabel is herself a
//   Mouse, so `excludeSelf` is what keeps her a 3/3 rather than a 4/4.
// - "When Mabel enters, create Cragflame, …" — Verix Bladewing's shape: a
//   self ETB trigger minting a *named legendary* token (`tokens/cragflame.ts`,
//   which carries the equip ability and the grant), not a generic one.
const LORD_TEXT = "Other Mice you control get +1/+1.";
const ETB_TEXT =
  "When Mabel enters, create Cragflame, a legendary colorless Equipment artifact token " +
  'with "Equipped creature gets +1/+1 and has vigilance, trample, and haste" and equip {2}.';

export default defineCard({
  name: "Mabel, Heir to Cragflame",
  manaCost: "{1}{R}{W}",
  colors: ["R", "W"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Mouse", "Soldier"],
  power: 3,
  toughness: 3,
  text: `${LORD_TEXT}\n${ETB_TEXT}`,
  static: [
    {
      affects: { scope: "creatures-you-control", subtype: "Mouse", excludeSelf: true },
      grantPt: [1, 1],
      text: LORD_TEXT,
    },
  ],
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: { kind: "create-token", token: "Cragflame", count: 1 },
      resolve: null,
      text: ETB_TEXT,
    },
  ],
});
