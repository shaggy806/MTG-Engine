import { defineCard } from "../define.js";

const UPKEEP_TEXT =
  "At the beginning of your upkeep, surveil 1. (Look at the top card of your library. You may put it into your graveyard.)";
const TOKEN_TEXT =
  "{T}: Create a 2/2 black Zombie Druid creature token. Activate only during your turn and only if a card left " +
  "your graveyard this turn.";

// "A card left your graveyard": any card you own, for anywhere — cast or
// played from it, returned to your hand or the battlefield, exiled.
export default defineCard({
  name: "Essence Anchor",
  manaCost: "{2}{U}",
  colors: ["U"],
  types: ["artifact"],
  text: `${UPKEEP_TEXT}\n${TOKEN_TEXT}`,
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "create-token", token: "Zombie Druid Token", count: 1 },
      resolve: null,
      condition: {
        kind: "all",
        of: [
          { kind: "your-turn" },
          { kind: "turn-stat", stat: "cards-left-graveyard", who: "you", atLeast: 1 },
        ],
      },
      text: TOKEN_TEXT,
    },
  ],
  triggered: [
    {
      trigger: { on: "step-begins", step: "upkeep", who: "you" },
      targets: [],
      effect: { kind: "surveil", amount: 1 },
      resolve: null,
      text: "At the beginning of your upkeep, surveil 1.",
    },
  ],
});
