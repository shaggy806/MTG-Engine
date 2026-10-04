import { defineCard } from "../define.js";

// EDHREC rank 3751.
//
// Rulings:
//   [2024-11-08] If Arahbo enters at the same time as one or more nontoken Cats you control, its
//     last ability will trigger once for each of those Cats (as well as itself).
//
// "Arahbo or another nontoken Cat" is two triggers (Go-Shintai of Life's
// Origin's shape): Arahbo itself, token or not, and each other nontoken Cat.

const ANTHEM_TEXT = "Other Cats you control get +1/+1.";
const CAT_TEXT = "Whenever Arahbo or another nontoken Cat you control enters, create a 1/1 white Cat creature token.";
const CAT = { kind: "create-token", token: "Cat Token (Arahbo, the First Fang)", count: 1 } as const;

export default defineCard({
  name: "Arahbo, the First Fang",
  manaCost: "{2}{W}",
  colors: ["W"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Cat", "Avatar"],
  power: 2,
  toughness: 2,
  text: `${ANTHEM_TEXT}\n${CAT_TEXT}`,
  static: [
    {
      affects: { scope: "creatures-you-control", excludeSelf: true, subtype: "Cat" },
      grantPt: [1, 1],
      text: ANTHEM_TEXT,
    },
  ],
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: CAT,
      resolve: null,
      text: CAT_TEXT,
    },
    {
      trigger: {
        on: "enters-battlefield",
        who: "you-control",
        otherOnly: true,
        filter: { subtype: "Cat", token: false },
      },
      targets: [],
      effect: CAT,
      resolve: null,
      text: CAT_TEXT,
    },
  ],
});
