import { defineCard } from "../define.js";

// #278 in top-commanders.txt.
const TEXT = "You may pay {W}{U}{B}{R}{G} rather than pay the mana cost for spells you cast.";

export default defineCard({
  name: "Jodah, Archmage Eternal",
  manaCost: "{1}{U}{R}{W}",
  colors: ["U", "R", "W"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Wizard"],
  power: 4,
  toughness: 3,
  keywords: ["flying"],
  text: `Flying\n${TEXT}`,
  static: [{ affects: { scope: "self" }, alternativeCostForSpells: { mana: "{W}{U}{B}{R}{G}" }, text: TEXT }],
});
