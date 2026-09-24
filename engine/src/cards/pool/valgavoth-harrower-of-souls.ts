import { defineCard } from "../define.js";
import { ward } from "../helpers.js";

// "Ward—Pay 2 life." is the `ward` helper's triggered ability (rule 702.21a).
// "For the first time during each of their turns" is the `loses-life`
// trigger's `firstDuringTheirTurn`: the opponent must be the active player,
// and this loss must be the first life they've lost this turn — one earlier
// in the turn, even before Valgavoth arrived, uses it up.
const LOSE_TEXT =
  "Whenever an opponent loses life for the first time during each of their turns, put a " +
  "+1/+1 counter on Valgavoth and draw a card.";

export default defineCard({
  name: "Valgavoth, Harrower of Souls",
  manaCost: "{2}{B}{R}",
  colors: ["B", "R"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Elder", "Demon"],
  power: 4,
  toughness: 4,
  keywords: ["flying"],
  text: `Flying\nWard—Pay 2 life.\n${LOSE_TEXT}`,
  triggered: [
    ward({ payLife: 2 }),
    {
      trigger: { on: "loses-life", who: "opponent", firstDuringTheirTurn: true },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "add-counter", target: "source", counter: "+1/+1", amount: 1 },
          { kind: "draw", amount: 1 },
        ],
      },
      resolve: null,
      text: LOSE_TEXT,
    },
  ],
});
