import { defineCard } from "../define.js";

/**
 * ROADMAP Phase 10 — adventure (rule 715). A made-up creature card whose
 * adventure half (`Ember Dart`) can be cast first; the card is then exiled and
 * you may cast the creature from exile later.
 */
export default defineCard({
  name: "Emberclaw Scout",
  manaCost: "{1}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Goblin", "Scout"],
  power: 2,
  toughness: 2,
  keywords: ["haste"],
  text: "Haste",
  faces: ["Emberclaw Scout", "Ember Dart"],
  adventure: true,
});
