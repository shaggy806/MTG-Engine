import { defineCard } from "../define.js";
import { investigate } from "../helpers.js";

// Rulings:
//   [2024-02-02] If an opponent lost life and subsequently lost the game, Teysa's second ability
//     still counts that player when determining how many times to investigate.
//   [2024-02-02] If an effect refers to a Clue, it means any Clue artifact, not just a Clue
//     artifact token.
//
// `playersWithTurnStat` counts an opponent who has since left the game. The
// Clue trigger is a "dies" (any battlefield → graveyard move) of a Clue you
// control — token or not — once each turn.
const END_TEXT = "At the beginning of your end step, investigate for each opponent who lost life this turn.";
const CLUE_TEXT =
  "Whenever a Clue you control is put into a graveyard from the battlefield, create a 1/1 white and black Spirit creature token with flying. This ability triggers only once each turn.";

export default defineCard({
  name: "Teysa, Opulent Oligarch",
  manaCost: "{1}{W}{B}",
  colors: ["W", "B"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Advisor"],
  power: 2,
  toughness: 3,
  keywords: ["deathtouch"],
  text: `Deathtouch\n${END_TEXT}\n${CLUE_TEXT}`,
  triggered: [
    {
      trigger: { on: "step-begins", step: "end", who: "you" },
      targets: [],
      effect: investigate({ playersWithTurnStat: "life-lost", who: "each-opponent" }),
      resolve: null,
      text: END_TEXT,
    },
    {
      trigger: { on: "dies", who: "you-control", filter: { subtype: "Clue" } },
      oncePerTurn: true,
      targets: [],
      effect: { kind: "create-token", token: "Spirit Token (White-Black)", count: 1 },
      resolve: null,
      text: CLUE_TEXT,
    },
  ],
});
