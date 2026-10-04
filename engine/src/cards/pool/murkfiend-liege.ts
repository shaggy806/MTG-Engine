import { defineCard } from "../define.js";

// EDHREC rank 2674.
//
// Rulings:
//   [2008-08-01] Multiple Murkfiend Lieges are redundant when it comes to the untap effect. You
//     can't untap your permanents more than once in a single untap step.
//   [2008-08-01] All your green and/or blue creatures untap during each other player's untap step.
//     You have no choice about what untaps. Those creatures untap at the same time as the active
//     player's permanents.
//   [2008-08-01] During each other player's untap step, effects that would otherwise cause your
//     green and/or blue creatures to stay tapped don't apply because they only apply during *your*
//     untap step. For example, if you control Nettle Sentinel (a green creature that says "Nettle
//     Sentinel doesn't untap during your untap step"), you untap it during each other player's
//     untap step.
//   [2008-08-01] The abilities are separate and cumulative. If another creature you control is
//     both of the listed colors, it will get a total of +2/+2.

const GREEN_TEXT = "Other green creatures you control get +1/+1.";
const BLUE_TEXT = "Other blue creatures you control get +1/+1.";
const UNTAP_TEXT = "Untap all green and/or blue creatures you control during each other player's untap step.";

// The two anthems are separate: a green-and-blue creature gets +2/+2 (the
// ruling). The untap is Seedborn Muse's, narrowed — the Liege itself included.
export default defineCard({
  name: "Murkfiend Liege",
  manaCost: "{2}{G/U}{G/U}{G/U}",
  colors: ["U", "G"],
  types: ["creature"],
  subtypes: ["Horror"],
  power: 4,
  toughness: 4,
  text: `${GREEN_TEXT}\n${BLUE_TEXT}\n${UNTAP_TEXT}`,
  static: [
    {
      affects: { scope: "filter", filter: { type: "creature", colors: ["G"], controlledBy: "you" }, excludeSelf: true },
      grantPt: [1, 1],
      text: GREEN_TEXT,
    },
    {
      affects: { scope: "filter", filter: { type: "creature", colors: ["U"], controlledBy: "you" }, excludeSelf: true },
      grantPt: [1, 1],
      text: BLUE_TEXT,
    },
    {
      affects: { scope: "self" },
      untapsDuringOthersUntap: { type: "creature", anyOf: [{ colors: ["G"] }, { colors: ["U"] }] },
      text: UNTAP_TEXT,
    },
  ],
});
