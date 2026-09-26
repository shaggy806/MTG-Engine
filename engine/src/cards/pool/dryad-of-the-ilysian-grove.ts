import { defineCard } from "../define.js";

// Every basic land type, not every land type: each of your lands taps for any
// colour (rule 305.6), and is a Plains, Island, Swamp, Mountain and Forest to
// anything that asks.
const LAND_TEXT = "You may play an additional land on each of your turns.";
const TYPES_TEXT = "Lands you control are every basic land type in addition to their other types.";

export default defineCard({
  name: "Dryad of the Ilysian Grove",
  manaCost: "{2}{G}",
  colors: ["G"],
  types: ["enchantment", "creature"],
  subtypes: ["Nymph", "Dryad"],
  power: 2,
  toughness: 4,
  text: `${LAND_TEXT}\n${TYPES_TEXT}`,
  static: [
    { affects: { scope: "self" }, extraLandsPerTurn: 1, text: LAND_TEXT },
    {
      affects: { scope: "filter", filter: { type: "land", controlledBy: "you" } },
      addSubtypes: ["Plains", "Island", "Swamp", "Mountain", "Forest"],
      text: TYPES_TEXT,
    },
  ],
});
