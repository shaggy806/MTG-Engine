import { defineCard } from "../define.js";

/**
 * ROADMAP Phase 10 — disturb (rule 702.150). A made-up transforming DFC: cast
 * the front face normally, or cast the back face (`Spectral Squire`) from your
 * graveyard for the disturb cost — it enters transformed and is exiled if it
 * would leave the battlefield.
 */
export default defineCard({
  name: "Gravebound Squire",
  manaCost: "{1}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Human", "Soldier"],
  power: 2,
  toughness: 2,
  text: "Disturb {2}{W} (You may cast this card from your graveyard transformed for its disturb cost.)",
  faces: ["Gravebound Squire", "Spectral Squire"],
  transform: true,
  disturb: { cost: "{2}{W}" },
});
