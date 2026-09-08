import { defineCard } from "../define.js";

/** ROADMAP Phase 10 — the disturb back face of Gravebound Squire. */
export default defineCard({
  name: "Spectral Squire",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Spirit", "Soldier"],
  power: 1,
  toughness: 1,
  keywords: ["flying"],
  text: "Flying",
  faces: ["Gravebound Squire", "Spectral Squire"],
  transform: true,
  disturb: { cost: "{2}{W}" },
});
