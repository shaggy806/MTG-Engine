import { defineCard } from "../define.js";

// EDHREC rank 4442.
// Makes Wizard → "Wizard Token (Kuja)" (the same 0/1 black Wizard).
//
// Rulings:
//   [2025-06-06] The Wizard token's ability resolves before the spell that caused it to trigger.
//     It resolves even if that spell is countered or otherwise leaves the stack.

const ATTACK_TEXT =
  "Whenever Queen Brahne attacks, create a 0/1 black Wizard creature token with \"Whenever you cast a noncreature spell, this token deals 1 damage to each opponent.\"";

export default defineCard({
  name: "Queen Brahne",
  manaCost: "{2}{R}",
  colors: ["R"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Noble"],
  power: 2,
  toughness: 1,
  text: `Prowess (Whenever you cast a noncreature spell, this creature gets +1/+1 until end of turn.)\n${ATTACK_TEXT}`,
  triggered: [
    {
      trigger: { on: "cast-spell", who: "you", noncreatureOnly: true },
      targets: [],
      effect: { kind: "modify-pt", target: "source", power: 1, toughness: 1, duration: "end-of-turn" },
      resolve: null,
      text: "Prowess (Whenever you cast a noncreature spell, this creature gets +1/+1 until end of turn.)",
    },
    {
      trigger: { on: "attacks", who: "self" },
      targets: [],
      effect: { kind: "create-token", token: "Wizard Token (Kuja)", count: 1 },
      resolve: null,
      text: ATTACK_TEXT,
    },
  ],
});
