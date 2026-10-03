import { defineCard } from "../define.js";

const MILL_TEXT = "{B}, Sacrifice another creature: Target player mills three cards.";
const MANA_TEXT = "Pay 1 life: Add {C}. Spend this mana only to cast a spell from your graveyard.";

// The mana ability has no {T} and no limit, so it's activated by hand as
// often as its controller likes (the auto-payer can't stand for an
// unlimited source), and the {C} it floats pays only for a spell cast from
// its controller's own graveyard — flashback, escape, a permission to cast
// it from there — the card still in the graveyard as its cost is paid.
export default defineCard({
  name: "Lord of the Forsaken",
  manaCost: "{4}{B}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Demon"],
  power: 6,
  toughness: 6,
  keywords: ["flying", "trample"],
  text: `Flying, trample\n${MILL_TEXT}\n${MANA_TEXT}`,
  activated: [
    {
      cost: { mana: "{B}", tap: false, sacrifice: { filter: { type: "creature" } } },
      otherOnly: true,
      targets: ["player"],
      effect: { kind: "mill", target: 0, amount: 3 },
      resolve: null,
      text: MILL_TEXT,
    },
    {
      cost: { mana: null, tap: false, payLife: 1 },
      targets: [],
      effect: {
        kind: "add-mana",
        mana: "C",
        amount: 1,
        spendOnly: { fromYourGraveyard: true, text: "Spend this mana only to cast a spell from your graveyard." },
      },
      resolve: null,
      text: MANA_TEXT,
    },
  ],
});
