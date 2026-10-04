import { defineCard } from "../define.js";

// EDHREC rank 2991.
// Makes Cat → use "Lifelink Cat Token".
//
// Rulings:
//   [2024-11-08] Multiple instances of lifelink on the same creature are redundant.
//   [2024-11-08] All other Cats you control get +1/+1 and have lifelink, not just those created by
//     Regal Caracal's last ability.

const LORD_TEXT = "Other Cats you control get +1/+1 and have lifelink.";
const ENTER_TEXT = "When this creature enters, create two 1/1 white Cat creature tokens with lifelink.";

export default defineCard({
  name: "Regal Caracal",
  manaCost: "{3}{W}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Cat"],
  power: 3,
  toughness: 3,
  text: `${LORD_TEXT} (Damage dealt by those creatures also causes you to gain that much life.)\n${ENTER_TEXT}`,
  static: [
    {
      affects: { scope: "creatures-you-control", excludeSelf: true, subtype: "Cat" },
      grantPt: [1, 1],
      grantKeywords: ["lifelink"],
      text: LORD_TEXT,
    },
  ],
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: { kind: "create-token", token: "Lifelink Cat Token", count: 2 },
      resolve: null,
      text: ENTER_TEXT,
    },
  ],
});
