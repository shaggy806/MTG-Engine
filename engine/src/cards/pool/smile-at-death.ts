import { distinctTargets } from "../helpers.js";
import { defineCard } from "../define.js";

// EDHREC rank 3659.
//
// One "return" instruction over both targets, so they enter together; the
// counters go on afterwards, as a separate instruction, on exactly the cards
// this ability put onto the battlefield (`thisWay` — Storm of Souls' shape).
// An illegal target returns nothing and gets nothing.
const TEXT =
  "At the beginning of your upkeep, return up to two target creature cards with power 2 or less from your graveyard to the battlefield. Put a +1/+1 counter on each of those creatures.";

export default defineCard({
  name: "Smile at Death",
  manaCost: "{3}{W}{W}",
  colors: ["W"],
  types: ["enchantment"],
  text: TEXT,
  triggered: [
    {
      trigger: { on: "step-begins", step: "upkeep", who: "you" },
      targets: distinctTargets(
        2,
        { kind: "card-in-graveyard", whose: "you", filter: { type: "creature", power: { op: "lte", n: 2 } } },
        { optional: true },
      ),
      effect: {
        kind: "sequence",
        effects: [
          {
            kind: "sequence",
            simultaneous: true,
            effects: [
              { kind: "put-onto-battlefield", target: 0 },
              { kind: "put-onto-battlefield", target: 1 },
            ],
          },
          {
            kind: "add-counter-all",
            filter: { type: "creature", thisWay: "put-onto-battlefield" },
            counter: "+1/+1",
            amount: 1,
          },
        ],
      },
      resolve: null,
      text: TEXT,
    },
  ],
});
