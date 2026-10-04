import { defineCard } from "../define.js";

// EDHREC rank 4159.
//
// Rulings:
//   [2023-11-10] Dauntless Dismantler's last ability destroys only artifacts whose mana values are
//     exactly X.
//   [2023-11-10] If an artifact an opponent controls enters the battlefield at the same time that
//     Dauntless Dismantler enters the battlefield, Dauntless Dismantler's effect won't apply to
//     that artifact.

const TAPPED_TEXT = "Artifacts your opponents control enter tapped.";
const DESTROY_TEXT = "{X}{X}{W}, Sacrifice this creature: Destroy each artifact with mana value X.";

// Blind Obedience's replacement and Steel Hellkite's `n: "x"` filter.
export default defineCard({
  name: "Dauntless Dismantler",
  manaCost: "{1}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Human", "Artificer"],
  power: 1,
  toughness: 4,
  text: `${TAPPED_TEXT}\n${DESTROY_TEXT}`,
  static: [
    {
      affects: { scope: "self" },
      replacement: {
        event: "others-enter-battlefield",
        filter: { type: "artifact", controlledBy: "opponent" },
        tapped: true,
      },
      text: TAPPED_TEXT,
    },
  ],
  activated: [
    {
      cost: { mana: "{X}{X}{W}", tap: false, sacrifice: "self" },
      targets: [],
      effect: { kind: "destroy-all", filter: { type: "artifact", manaValue: { op: "eq", n: "x" } } },
      resolve: null,
      text: DESTROY_TEXT,
    },
  ],
});
