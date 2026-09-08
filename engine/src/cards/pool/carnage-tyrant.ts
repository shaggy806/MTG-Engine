import { defineCard } from "../define.js";

/** ROADMAP Phase 10 — "This spell can't be countered." (rule 701.5f). */
export default defineCard({
  name: "Carnage Tyrant",
  manaCost: "{4}{G}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Dinosaur"],
  power: 7,
  toughness: 6,
  keywords: ["trample", "hexproof"],
  text: "This spell can't be countered.\nTrample, hexproof",
  cantBeCountered: true,
});
