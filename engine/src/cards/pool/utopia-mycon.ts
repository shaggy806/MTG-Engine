import { defineCard } from "../define.js";

// EDHREC rank 5156.
// Makes Saproling → use "Saproling Token".

const UPKEEP_TEXT = "At the beginning of your upkeep, put a spore counter on this creature.";
const SPORE_TEXT = "Remove three spore counters from this creature: Create a 1/1 green Saproling creature token.";
const MANA_TEXT = "Sacrifice a Saproling: Add one mana of any color.";

export default defineCard({
  name: "Utopia Mycon",
  manaCost: "{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Fungus"],
  power: 0,
  toughness: 2,
  text: `${UPKEEP_TEXT}\n${SPORE_TEXT}\n${MANA_TEXT}`,
  activated: [
    {
      cost: { mana: null, tap: false, removeCounter: { kind: "spore", count: 3 } },
      targets: [],
      effect: { kind: "create-token", token: "Saproling Token", count: 1 },
      resolve: null,
      text: SPORE_TEXT,
    },
    {
      cost: { mana: null, tap: false, sacrifice: { filter: { subtype: "Saproling" } } },
      targets: [],
      effect: { kind: "add-mana", mana: "any-color", amount: 1 },
      resolve: null,
      text: MANA_TEXT,
    },
  ],
  triggered: [
    {
      trigger: { on: "step-begins", step: "upkeep", who: "you" },
      targets: [],
      effect: { kind: "add-counter", target: "source", counter: "spore", amount: 1 },
      resolve: null,
      text: UPKEEP_TEXT,
    },
  ],
});
