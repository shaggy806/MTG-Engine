import { defineCard } from "../define.js";

// EDHREC rank 4267.
//
// Rulings:
//   [2025-06-06] The Wizard token's ability resolves before the spell that caused it to trigger.
//     It resolves even if that spell is countered or otherwise leaves the stack.

const TEXT =
  'When this creature enters, create a 0/1 black Wizard creature token with "Whenever you cast a noncreature spell, this token deals 1 damage to each opponent."';

export default defineCard({
  name: "Mysidian Elder",
  manaCost: "{2}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Human", "Wizard"],
  power: 1,
  toughness: 3,
  text: TEXT,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      // The same 0/1 black Wizard Kuja, Genome Sorcerer makes.
      effect: { kind: "create-token", token: "Wizard Token (Kuja)", count: 1 },
      resolve: null,
      text: TEXT,
    },
  ],
});
