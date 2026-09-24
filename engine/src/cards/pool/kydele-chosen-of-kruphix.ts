import { defineCard } from "../define.js";

// Top-commanders rank 463. "Each card you've drawn this turn" is the
// `cards-drawn` turn stat: draws only, so a tutor to hand doesn't count, and
// it resets as each turn begins — Kydele works on an opponent's turn too,
// counting what you drew during it. Partner is declared by `pairing`.
const MANA_TEXT = "{T}: Add {C} for each card you've drawn this turn.";

export default defineCard({
  name: "Kydele, Chosen of Kruphix",
  manaCost: "{2}{G}{U}",
  colors: ["G", "U"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Wizard"],
  power: 2,
  toughness: 3,
  pairing: { kind: "partner" },
  text: `${MANA_TEXT}\nPartner (You can have two commanders if both have partner.)`,
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "C", amount: { turnStat: "cards-drawn" } },
      resolve: null,
      text: MANA_TEXT,
    },
  ],
});
