import { defineCard } from "../define.js";

const POWER_TEXT = "Uurg's power is equal to the number of land cards in your graveyard.";
const SURVEIL_TEXT =
  "At the beginning of your upkeep, surveil 1. (Look at the top card of your library. You may put that card into your graveyard.)";
const LIFE_TEXT = "{B}{G}, Sacrifice a land: You gain 2 life.";

// The power is a characteristic-defining ability, so it works in every zone
// (the ruling).
export default defineCard({
  name: "Uurg, Spawn of Turg",
  manaCost: "{B}{B}{G}",
  colors: ["B", "G"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Frog", "Beast"],
  power: 0,
  toughness: 5,
  text: `${POWER_TEXT}\n${SURVEIL_TEXT}\n${LIFE_TEXT}`,
  static: [
    {
      affects: { scope: "self" },
      setBasePtFromCount: {
        countOf: { countInGraveyard: { type: "land", ownedBy: "you" } },
        plusPower: 0,
        plusToughness: 0,
        only: "power",
      },
      text: POWER_TEXT,
    },
  ],
  triggered: [
    {
      trigger: { on: "step-begins", step: "upkeep", who: "you" },
      targets: [],
      effect: { kind: "surveil", amount: 1 },
      resolve: null,
      text: SURVEIL_TEXT,
    },
  ],
  activated: [
    {
      cost: { mana: "{B}{G}", tap: false, sacrifice: { filter: { type: "land" } } },
      targets: [],
      effect: { kind: "gain-life", amount: 2 },
      resolve: null,
      text: LIFE_TEXT,
    },
  ],
});
