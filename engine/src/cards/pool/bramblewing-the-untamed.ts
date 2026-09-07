import { defineCard } from "../define.js";

/**
 * ROADMAP Phase 9 — a Partner commander (pairs with Corvath, Ember Scribe).
 * "Partner" is just recognised by `validateCommanderDeck` (the word in the
 * rules text); the engine's `setup` accepts a `commanders: string[]` list and
 * taxes each commander separately.
 */
export default defineCard({
  name: "Bramblewing, the Untamed",
  manaCost: "{1}{G}",
  colors: ["G"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Elf", "Scout"],
  power: 2,
  toughness: 2,
  keywords: ["reach"],
  text: "Reach\nPartner (You can have two commanders if both have partner.)",
});
