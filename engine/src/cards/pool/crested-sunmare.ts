import { defineCard } from "../define.js";

// EDHREC rank 4198.
//
// Rulings:
//   [2017-07-14] Crested Sunmare’s triggered ability won’t trigger unless you’ve gained life in
//     the turn before the end step began. It can’t be satisfied by another triggered ability
//     causing you to gain life during that end step.
//   [2017-07-14] Crested Sunmare’s triggered ability cares only whether you gained life in the
//     turn, even if Crested Sunmare wasn’t on the battlefield when that happened. It doesn’t care
//     how much you gained, whether you also lost life, or even whether you lost more life than you
//     gained.
//   [2017-07-14] If a creature has been dealt damage, that damage remains marked on it until the
//     cleanup step. If another Horse you control has been dealt lethal damage, and later in the
//     turn Crested Sunmare leaves the battlefield, that Horse will be destroyed.

const STATIC_TEXT = "Other Horses you control have indestructible.";
const TRIGGER_TEXT =
  "At the beginning of each end step, if you gained life this turn, create a 5/5 white Horse creature token.";

export default defineCard({
  name: "Crested Sunmare",
  manaCost: "{3}{W}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Horse"],
  power: 5,
  toughness: 5,
  text: `${STATIC_TEXT}\n${TRIGGER_TEXT}`,
  static: [
    {
      affects: { scope: "filter", filter: { subtype: "Horse", controlledBy: "you" }, excludeSelf: true },
      grantKeywords: ["indestructible"],
      text: STATIC_TEXT,
    },
  ],
  triggered: [
    {
      trigger: { on: "step-begins", step: "end", who: "any" },
      condition: { kind: "turn-stat", stat: "life-gained", who: "you", atLeast: 1 },
      targets: [],
      effect: { kind: "create-token", token: "Horse Token", count: 1 },
      resolve: null,
      text: TRIGGER_TEXT,
    },
  ],
});
