import { defineCard } from "../define.js";

// EDHREC rank 3144.
//
// Encore is Amphin Mutineer's shape: an activated ability from the graveyard (`zone:
// "graveyard"` exiles the card as its cost), the `encore` effect making the attacking token
// copies.

const DIES_TEXT =
  "When this creature dies, create three 3/3 colorless Phyrexian Golem artifact creature tokens.";
const ENCORE_TEXT =
  "Encore {12} ({12}, Exile this card from your graveyard: For each opponent, create a token copy that attacks that opponent this turn if able. They gain haste. Sacrifice them at the beginning of the next end step. Activate only as a sorcery.)";

export default defineCard({
  name: "Phyrexian Triniform",
  manaCost: "{9}",
  colors: [],
  types: ["artifact", "creature"],
  subtypes: ["Phyrexian", "Golem"],
  power: 9,
  toughness: 9,
  text: `${DIES_TEXT}\n${ENCORE_TEXT}`,
  triggered: [
    {
      trigger: { on: "dies", who: "self" },
      targets: [],
      effect: { kind: "create-token", token: "Phyrexian Golem Token", count: 3 },
      resolve: null,
      text: DIES_TEXT,
    },
  ],
  activated: [
    {
      cost: { mana: "{12}", tap: false },
      zone: "graveyard",
      sorcerySpeed: true,
      targets: [],
      effect: { kind: "encore" },
      resolve: null,
      text: "Encore {12} — Exile this card from your graveyard: For each opponent, create a token copy that attacks that opponent this turn if able.",
    },
  ],
});
