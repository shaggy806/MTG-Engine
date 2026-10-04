import { defineCard } from "../define.js";

// EDHREC rank 5073.
//
// Rulings:
//   [2025-04-04] Glacierwood Siege’s Sultai ability doesn’t allow you to activate abilities (such
//     as cycling) of land cards in your graveyard.
//   [2025-04-04] Glacierwood Siege’s Sultai ability doesn’t change the times when you can play
//     those land cards. You can still play only one land per turn, and only during your main phase
//     when you have priority and the stack is empty.
//   [2025-04-04] If you somehow control Glacierwood Siege and no choice was made for it (perhaps
//     because another permanent on the battlefield became a copy of it), it has neither of the two
//     abilities.

// Frostcliff Siege's shape: each mode is gated on the word chosen as it
// entered, and neither works when nothing was chosen (the ruling). The
// Sultai mode is Ramunap Excavator's permission, under the normal land-play
// rules (the ruling).
const TEMUR_TEXT = "Temur — Whenever you cast an instant or sorcery spell, target player mills four cards.";
const SULTAI_TEXT = "Sultai — You may play lands from your graveyard.";

export default defineCard({
  name: "Glacierwood Siege",
  manaCost: "{1}{G}{U}",
  colors: ["U", "G"],
  types: ["enchantment"],
  text: `As this enchantment enters, choose Temur or Sultai.\n• ${TEMUR_TEXT}\n• ${SULTAI_TEXT}`,
  chooseOnEnter: ["Temur", "Sultai"],
  triggered: [
    {
      trigger: { on: "cast-spell", who: "you", filter: { typesAnyOf: ["instant", "sorcery"] } },
      condition: { kind: "chosen-on-enter", value: "Temur" },
      targets: ["player"],
      effect: { kind: "mill", target: 0, amount: 4 },
      resolve: null,
      text: TEMUR_TEXT,
    },
  ],
  static: [
    {
      affects: { scope: "self" },
      condition: { kind: "chosen-on-enter", value: "Sultai" },
      playFromGraveyard: { type: "land" },
      text: SULTAI_TEXT,
    },
  ],
});
