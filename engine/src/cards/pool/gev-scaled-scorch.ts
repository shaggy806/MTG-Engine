import { defineCard } from "../define.js";
import { ward } from "../helpers.js";

// #254 in top-commanders.txt.
//
// The counters are an `others-enter-battlefield` replacement, counted as each
// creature enters.
const COUNTERS_TEXT =
  "Other creatures you control enter with an additional +1/+1 counter on them for each opponent who lost life this turn.";
const LIZARD_TEXT = "Whenever you cast a Lizard spell, Gev deals 1 damage to target opponent.";
const WARD = ward({ payLife: 2 });

export default defineCard({
  name: "Gev, Scaled Scorch",
  manaCost: "{B}{R}",
  colors: ["B", "R"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Lizard", "Mercenary"],
  power: 3,
  toughness: 2,
  text: `${WARD.text}\n${COUNTERS_TEXT}\n${LIZARD_TEXT}`,
  static: [
    {
      affects: { scope: "self" },
      replacement: {
        event: "others-enter-battlefield",
        filter: { type: "creature", controlledBy: "you" },
        counters: { kind: "+1/+1", amount: { playersWithTurnStat: "life-lost", who: "each-opponent" } },
      },
      text: COUNTERS_TEXT,
    },
  ],
  triggered: [
    WARD,
    {
      trigger: { on: "cast-spell", who: "you", filter: { subtype: "Lizard" } },
      targets: ["opponent"],
      effect: { kind: "damage", amount: 1, target: 0 },
      resolve: null,
      text: LIZARD_TEXT,
    },
  ],
});
