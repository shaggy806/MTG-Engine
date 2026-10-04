import { defineCard } from "../define.js";

// EDHREC rank 2799.
//
// Rulings:
//   [2020-09-25] Emeria's Call affects only creatures you control at the time it resolves.
//     Creatures you begin to control later won't gain indestructible.
// `grant-keyword-all` reaches the creatures matching as it resolves, each
// granted once; the new Angel Warriors are Angels, so it skips them either way.
export default defineCard({
  name: "Emeria's Call",
  manaCost: "{4}{W}{W}{W}",
  colors: ["W"],
  types: ["sorcery"],
  text: "Create two 4/4 white Angel Warrior creature tokens with flying. Non-Angel creatures you control gain indestructible until your next turn.",
  effect: {
    kind: "sequence",
    effects: [
      { kind: "create-token", token: "Angel Warrior Token", count: 2 },
      {
        kind: "grant-keyword-all",
        filter: { type: "creature", controlledBy: "you", notSubtypes: ["Angel"] },
        keyword: "indestructible",
        duration: "until-your-next-turn",
      },
    ],
  },
  faces: ["Emeria's Call", "Emeria, Shattered Skyclave"],
});
