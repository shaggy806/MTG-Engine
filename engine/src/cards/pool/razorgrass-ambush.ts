import { defineCard } from "../define.js";

/** A modal double-faced card (instant // land) — its back face, Razorgrass
 * Field, is a land you play instead. */
export default defineCard({
  name: "Razorgrass Ambush",
  manaCost: "{1}{W}",
  colors: ["W"],
  types: ["instant"],
  text: "Razorgrass Ambush deals 3 damage to target attacking or blocking creature.",
  targets: ["attacking-or-blocking-creature"],
  effect: { kind: "damage", amount: 3, target: 0 },
  faces: ["Razorgrass Ambush", "Razorgrass Field"],
});
