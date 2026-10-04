import { defineCard } from "../define.js";

// EDHREC rank 3944.
// Makes Soldier → use "Soldier Token".
//
// Rulings:
//   [2009-10-01] Captain of the Watch grants +1/+1 and vigilance to all other Soldier creatures
//     you control, not just the ones its ability puts onto the battlefield.

const STATIC_TEXT = "Other Soldier creatures you control get +1/+1 and have vigilance.";
const ENTER_TEXT = "When this creature enters, create three 1/1 white Soldier creature tokens.";

export default defineCard({
  name: "Captain of the Watch",
  manaCost: "{4}{W}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Human", "Soldier"],
  power: 3,
  toughness: 3,
  keywords: ["vigilance"],
  text: `Vigilance (Attacking doesn't cause this creature to tap.)\n${STATIC_TEXT}\n${ENTER_TEXT}`,
  static: [
    {
      affects: { scope: "creatures-you-control", subtype: "Soldier", excludeSelf: true },
      grantPt: [1, 1],
      grantKeywords: ["vigilance"],
      text: STATIC_TEXT,
    },
  ],
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: { kind: "create-token", token: "Soldier Token", count: 3 },
      resolve: null,
      text: ENTER_TEXT,
    },
  ],
});
