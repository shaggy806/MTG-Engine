import { defineCard } from "../define.js";

// EDHREC rank 3114.
//
// Rulings:
//   [2022-06-10] Goading a creature after it has been declared as a blocker will not remove it
//     from combat.

const BLOCK_TEXT = "Goaded creatures your opponents control can't block.";
const GOAD_TEXT =
  "Whenever you cast a noncreature spell, goad target creature an opponent controls. (Until your next turn, that creature attacks each combat if able and attacks a player other than you if able.)";

export default defineCard({
  name: "Bothersome Quasit",
  manaCost: "{2}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Demon"],
  power: 3,
  toughness: 2,
  keywords: ["menace"],
  text: `Menace\n${BLOCK_TEXT}\n${GOAD_TEXT}`,
  static: [
    {
      // Goaded by anyone (rule 701.15b).
      affects: { scope: "filter", filter: { type: "creature", controlledBy: "opponent", goaded: true } },
      restrictions: ["cant-block"],
      text: BLOCK_TEXT,
    },
  ],
  triggered: [
    {
      trigger: { on: "cast-spell", who: "you", noncreatureOnly: true },
      targets: ["creature-an-opponent-controls"],
      effect: { kind: "goad", target: 0 },
      resolve: null,
      text: GOAD_TEXT,
    },
  ],
});
