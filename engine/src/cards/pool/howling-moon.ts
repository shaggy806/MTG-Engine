import { defineCard } from "../define.js";

// EDHREC rank 5621.
// Makes Wolf → uses "Wolf Token".
//
// The Wolf trigger is Monologue Tax's: once each turn for each opponent, on
// their second spell, the first counting even if it was countered or cast
// before Howling Moon arrived.

const PUMP_TEXT =
  "At the beginning of combat on your turn, target Wolf or Werewolf you control gets +2/+2 until end of turn.";
const WOLF_TEXT = "Whenever an opponent casts their second spell each turn, create a 2/2 green Wolf creature token.";

export default defineCard({
  name: "Howling Moon",
  manaCost: "{2}{G}",
  colors: ["G"],
  types: ["enchantment"],
  text: `${PUMP_TEXT}\n${WOLF_TEXT}`,
  triggered: [
    {
      trigger: { on: "step-begins", step: "begin-combat", who: "you" },
      targets: [{ kind: "permanent", whose: "you", filter: { subtypes: ["Wolf", "Werewolf"] } }],
      effect: { kind: "modify-pt", target: 0, power: 2, toughness: 2, duration: "end-of-turn" },
      resolve: null,
      text: PUMP_TEXT,
    },
    {
      trigger: { on: "cast-spell", who: "opponent", nthEachTurn: 2 },
      targets: [],
      effect: { kind: "create-token", token: "Wolf Token", count: 1 },
      resolve: null,
      text: WOLF_TEXT,
    },
  ],
});
