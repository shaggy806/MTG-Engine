import { defineCard } from "../define.js";

// A `cast-spell` trigger whose filter reads the spell's subtypes off the
// stack; `subtypes` is an OR within itself, so any one of the three counts.
// Sram is none of them, so it never sees its own cast.
const CAST_TEXT = "Whenever you cast an Aura, Equipment, or Vehicle spell, draw a card.";

export default defineCard({
  name: "Sram, Senior Edificer",
  manaCost: "{1}{W}",
  colors: ["W"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Dwarf", "Advisor"],
  power: 2,
  toughness: 2,
  text: CAST_TEXT,
  triggered: [
    {
      trigger: {
        on: "cast-spell",
        who: "you",
        filter: { subtypes: ["Aura", "Equipment", "Vehicle"] },
      },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: CAST_TEXT,
    },
  ],
});
