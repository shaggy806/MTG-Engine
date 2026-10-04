import { defineCard } from "../define.js";

// EDHREC rank 3312.
//
// Rulings:
//   [2017-09-29] If a creature an opponent controls enters the battlefield at the same time that
//     Kinjalli's Sunwing enters the battlefield under your control, Kinjalli's Sunwing's effect
//     doesn't apply to your opponent's creature.

const TAPPED_TEXT = "Creatures your opponents control enter tapped.";

export default defineCard({
  name: "Kinjalli's Sunwing",
  manaCost: "{2}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Dinosaur"],
  power: 2,
  toughness: 3,
  keywords: ["flying"],
  text: `Flying\n${TAPPED_TEXT}`,
  // Authority of the Consuls' replacement.
  static: [
    {
      affects: { scope: "self" },
      replacement: {
        event: "others-enter-battlefield",
        filter: { type: "creature", controlledBy: "opponent" },
        tapped: true,
      },
      text: TAPPED_TEXT,
    },
  ],
});
