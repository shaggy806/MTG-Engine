import { defineCard } from "../define.js";
import { melee } from "../helpers.js";

// EDHREC rank 3242.
//
// Rulings:
//   [2023-02-04] Creatures that enter the battlefield attacking were never declared as attackers,
//     so they won't count toward melee's effect. Similarly, if a creature with melee enters the
//     battlefield attacking, melee won't trigger.
//   [2023-02-04] You determine the size of the bonus as the melee ability resolves. Count each
//     opponent that you attacked with one or more creatures.
//
// Lieutenant is a condition on controlling your own commander; the granted
// melee is the same triggered ability the helper prints, on each other
// creature (each instance triggers on its own, rule 702.121b).
const MELEE_TEXT =
  "Melee (Whenever this creature attacks, it gets +1/+1 until end of turn for each opponent you attacked this combat.)";
const LIEUTENANT_TEXT = "Lieutenant — As long as you control your commander, other creatures you control have melee.";

export default defineCard({
  name: "Skyhunter Strike Force",
  manaCost: "{2}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Cat", "Knight"],
  power: 2,
  toughness: 2,
  keywords: ["flying"],
  text: `Flying\n${MELEE_TEXT}\n${LIEUTENANT_TEXT}`,
  triggered: [melee()],
  static: [
    {
      affects: { scope: "creatures-you-control", excludeSelf: true },
      condition: { kind: "controls", filter: { isCommander: true, controlledBy: "you", ownedBy: "you" }, atLeast: 1 },
      grantsTriggered: [melee()],
      text: LIEUTENANT_TEXT,
    },
  ],
});
