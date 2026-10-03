import { defineCard } from "../define.js";

const UPKEEP =
  "At the beginning of your upkeep, if you have exactly thirteen cards in your hand, you win the game.";

// An intervening-if (rule 603.4): exactly thirteen as the upkeep begins, and
// again as it resolves.
export default defineCard({
  name: "Triskaidekaphile",
  manaCost: "{1}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Human", "Wizard"],
  power: 1,
  toughness: 3,
  text: `You have no maximum hand size.\n${UPKEEP}\n{3}{U}: Draw a card.`,
  activated: [
    {
      cost: { mana: "{3}{U}", tap: false },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: "{3}{U}: Draw a card.",
    },
  ],
  triggered: [
    {
      trigger: { on: "step-begins", step: "upkeep", who: "you" },
      condition: { kind: "hand-size", atLeast: 13, atMost: 13 },
      targets: [],
      effect: { kind: "win-game" },
      resolve: null,
      text: UPKEEP,
    },
  ],
  static: [{ affects: { scope: "self" }, noMaxHandSize: true, text: "You have no maximum hand size." }],
});
