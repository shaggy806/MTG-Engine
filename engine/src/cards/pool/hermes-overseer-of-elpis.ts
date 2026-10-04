import { defineCard } from "../define.js";

// EDHREC rank 3416.
// Makes Bird → new token "Bird Token (Hermes, Overseer of Elpis)".
//
// Rulings:
//   [2025-06-06] Hermes's first ability resolves before the spell that caused it to trigger. It
//     resolves even if that spell is countered or otherwise leaves the stack.

const BIRD_TEXT =
  "Whenever you cast a noncreature spell, create a 1/1 blue Bird creature token with flying and vigilance.";
const SCRY_TEXT = "Whenever you attack with one or more Birds, scry 2.";

export default defineCard({
  name: "Hermes, Overseer of Elpis",
  manaCost: "{3}{U}",
  colors: ["U"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Elder", "Wizard"],
  power: 2,
  toughness: 4,
  text: `${BIRD_TEXT}\n${SCRY_TEXT}`,
  triggered: [
    {
      trigger: { on: "cast-spell", who: "you", noncreatureOnly: true },
      targets: [],
      effect: { kind: "create-token", token: "Bird Token (Hermes, Overseer of Elpis)", count: 1 },
      resolve: null,
      text: BIRD_TEXT,
    },
    {
      // Once per declaration, however many Birds (Sidar Jabari's Knights).
      trigger: { on: "attack-with", who: "you", atLeast: 1, filter: { subtype: "Bird" } },
      targets: [],
      effect: { kind: "scry", amount: 2 },
      resolve: null,
      text: SCRY_TEXT,
    },
  ],
});
