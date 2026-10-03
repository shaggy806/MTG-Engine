import { defineCard } from "../define.js";

// Top-commanders rank 239. The rulings this follows: a lost flip returns the
// spell only if it's still on the stack (not if it was countered), and that
// isn't countering it, so "can't be countered" doesn't stop it; a copy cast
// (Mnemonic Deluge) returned to hand ceases to exist; a won flip copies the
// spell even if it has left the stack since, and even with no targets; the
// copy keeps the original's modes, {X}, division and the costs paid for it,
// isn't cast, and resolves first.
const FLIP_TEXT =
  "Whenever you cast an instant or sorcery spell, flip a coin. If you lose the flip, return that spell to " +
  "its owner's hand. If you win the flip, copy that spell, and you may choose new targets for the copy.";

export default defineCard({
  name: "Krark, the Thumbless",
  manaCost: "{1}{R}",
  colors: ["R"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Goblin", "Wizard"],
  power: 2,
  toughness: 2,
  pairing: { kind: "partner" },
  text: `${FLIP_TEXT}\nPartner (You can have two commanders if both have partner.)`,
  triggered: [
    {
      trigger: { on: "cast-spell", who: "you", filter: { typesAnyOf: ["instant", "sorcery"] } },
      targets: [],
      effect: {
        kind: "flip-coin",
        lost: { kind: "return-to-hand", target: "trigger-object", from: "stack" },
        won: { kind: "copy-spell", target: "trigger-spell", newTargets: true },
      },
      resolve: null,
      text: FLIP_TEXT,
    },
  ],
});
