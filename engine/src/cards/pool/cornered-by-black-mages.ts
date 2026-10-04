import { defineCard } from "../define.js";

// EDHREC rank 3033.
// Makes Wizard → "Wizard Token (Kuja)" (the same 0/1 black Wizard with the same ability).
//
// Rulings:
//   [2025-06-06] The Wizard token's ability resolves before the spell that caused it to trigger.
//     It resolves even if that spell is countered or otherwise leaves the stack.

export default defineCard({
  name: "Cornered by Black Mages",
  manaCost: "{1}{B}{B}",
  colors: ["B"],
  types: ["sorcery"],
  text: "Target opponent sacrifices a creature of their choice.\nCreate a 0/1 black Wizard creature token with \"Whenever you cast a noncreature spell, this token deals 1 damage to each opponent.\"",
  targets: ["opponent"],
  effect: {
    kind: "sequence",
    effects: [
      { kind: "sacrifice", who: "target", filter: { type: "creature" }, count: 1 },
      { kind: "create-token", token: "Wizard Token (Kuja)", count: 1 },
    ],
  },
});
