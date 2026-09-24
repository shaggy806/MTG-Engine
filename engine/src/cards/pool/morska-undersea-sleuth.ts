import { defineCard } from "../define.js";
import { investigate } from "../helpers.js";

// Top-commanders rank 351. "Your second card each turn" is your own draw
// count for the turn (`card-drawn`'s `nthThisTurn`), so a card drawn before
// Morska was on the battlefield still counts toward it — the same reading as
// Faerie Mastermind's ruling. Only the second draw fires it, not every one
// after.
const HAND_TEXT = "You have no maximum hand size.";
const UPKEEP_TEXT =
  "At the beginning of your upkeep, investigate. (Create a Clue token. It's an artifact " +
  'with "{2}, Sacrifice this token: Draw a card.")';
const DRAW_TEXT = "Whenever you draw your second card each turn, put two +1/+1 counters on Morska.";

export default defineCard({
  name: "Morska, Undersea Sleuth",
  manaCost: "{G}{W}{U}",
  colors: ["G", "W", "U"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Vedalken", "Fish", "Detective"],
  power: 2,
  toughness: 3,
  text: HAND_TEXT + "\n" + UPKEEP_TEXT + "\n" + DRAW_TEXT,
  static: [
    {
      affects: { scope: "self" },
      noMaxHandSize: true,
      text: HAND_TEXT,
    },
  ],
  triggered: [
    {
      trigger: { on: "step-begins", step: "upkeep", who: "you" },
      targets: [],
      effect: investigate(),
      resolve: null,
      text: UPKEEP_TEXT,
    },
    {
      trigger: { on: "draws", who: "you", nthEachTurn: 2 },
      targets: [],
      effect: { kind: "add-counter", target: "source", counter: "+1/+1", amount: 2 },
      resolve: null,
      text: DRAW_TEXT,
    },
  ],
});
