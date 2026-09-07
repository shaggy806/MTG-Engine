import { defineCard } from "../define.js";

/** ROADMAP Phase 9 — a Partner commander (pairs with Bramblewing, the Untamed). */
export default defineCard({
  name: "Corvath, Ember Scribe",
  manaCost: "{1}{R}",
  colors: ["R"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Goblin", "Wizard"],
  power: 2,
  toughness: 1,
  keywords: ["haste"],
  text: "Haste\nPartner (You can have two commanders if both have partner.)",
});
