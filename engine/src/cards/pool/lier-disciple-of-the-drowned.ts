import { defineCard } from "../define.js";

const COUNTER_TEXT = "Spells can't be countered.";
const FLASHBACK_TEXT =
  "Each instant and sorcery card in your graveyard has flashback. The flashback cost is equal to that card's mana cost.";

// Every player's spells, Lier's own controller's included. A card with a
// printed flashback offers both.
export default defineCard({
  name: "Lier, Disciple of the Drowned",
  manaCost: "{3}{U}{U}",
  colors: ["U"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Wizard"],
  power: 3,
  toughness: 4,
  text: `${COUNTER_TEXT}\n${FLASHBACK_TEXT}`,
  static: [
    {
      affects: { scope: "self" },
      grantsToSpells: { cantBeCountered: true, allSpells: true },
      text: COUNTER_TEXT,
    },
    {
      affects: { scope: "self" },
      grantsToGraveyard: {
        filter: { typesAnyOf: ["instant", "sorcery"] },
        flashback: { cost: "mana-cost" },
      },
      text: FLASHBACK_TEXT,
    },
  ],
});
