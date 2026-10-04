import { defineCard } from "../define.js";

// EDHREC rank 4666.
//
// Rulings:
//   [2025-01-24] Once Deranged Assistant’s ability has been activated, it can’t be reversed for
//     any reason. If you activate it while casting a spell and discover you can’t produce enough
//     mana to pay that spell’s costs, the spell is reversed. [...]
//
// That ruling predates the current rule 605.1a (CR 2026-09-25): an ability whose cost moves a
// card from a library is no longer a mana ability, so this one uses the stack and can't be
// activated while paying a cost — Millikin's identical ability, and its 2026-08-05 ruling.

const MANA_TEXT =
  "{T}, Mill a card: Add {C}. (Activate only as an instant. To mill a card, put the top card of your library into your graveyard.)";

export default defineCard({
  name: "Deranged Assistant",
  manaCost: "{1}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Human", "Wizard"],
  power: 1,
  toughness: 1,
  text: MANA_TEXT,
  activated: [
    {
      cost: { mana: null, tap: true, mill: 1 },
      targets: [],
      effect: { kind: "add-mana", mana: "C", amount: 1 },
      resolve: null,
      text: MANA_TEXT,
    },
  ],
});
