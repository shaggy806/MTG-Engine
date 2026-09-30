import { defineCard } from "../define.js";

const POWER_TEXT = "Haughty Djinn's power is equal to the number of instant and sorcery cards in your graveyard.";
const COST_TEXT = "Instant and sorcery spells you cast cost {1} less to cast.";

export default defineCard({
  name: "Haughty Djinn",
  manaCost: "{1}{U}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Djinn"],
  power: 0,
  toughness: 4,
  keywords: ["flying"],
  text: `Flying\n${POWER_TEXT}\n${COST_TEXT}`,
  static: [
    {
      affects: { scope: "self" },
      setBasePtFromCount: {
        countOf: { countInGraveyard: { typesAnyOf: ["instant", "sorcery"], ownedBy: "you" } },
        plusPower: 0,
        plusToughness: 0,
        only: "power",
      },
      text: POWER_TEXT,
    },
    {
      affects: { scope: "self" },
      costModification: { applies: { typesAnyOf: ["instant", "sorcery"] }, caster: "you", reduceGeneric: 1 },
      text: COST_TEXT,
    },
  ],
});
