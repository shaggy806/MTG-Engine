import { defineCard } from "../define.js";

// EDHREC rank 6411.
//
// Rulings:
//   [2018-07-13] If enough -1/-1 counters are put on Bloodtracker at the same time to make its
//     toughness 0 or less, the number of +1/+1 counters on it before it got any -1/-1 counters
//     will be used to determine how many cards you draw. For example, if there are three +1/+1
//     counters on Bloodtracker and it gets six -1/-1 counters, you'll draw three cards. That's
//     because Bloodtracker's triggered ability checks the creature's existence just before it
//     leaves the battlefield, and it still has all those counters on it at that point.

const PUMP_TEXT = "{B}, Pay 2 life: Put a +1/+1 counter on this creature.";
const LEAVE_TEXT = "When this creature leaves the battlefield, draw a card for each +1/+1 counter on it.";

export default defineCard({
  name: "Bloodtracker",
  manaCost: "{3}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Vampire", "Wizard"],
  power: 2,
  toughness: 2,
  keywords: ["flying"],
  text: `Flying\n${PUMP_TEXT}\n${LEAVE_TEXT}`,
  activated: [
    {
      cost: { mana: "{B}", tap: false, payLife: 2 },
      targets: [],
      effect: { kind: "add-counter", target: "source", counter: "+1/+1", amount: 1 },
      resolve: null,
      text: PUMP_TEXT,
    },
  ],
  triggered: [
    {
      trigger: { on: "leaves-battlefield", who: "self" },
      targets: [],
      // Toothy's shape: read as it last existed (rule 603.10a), so the
      // -1/-1 ruling's +1/+1 counters still count.
      effect: { kind: "draw", amount: { countersOn: "source", counter: "+1/+1" } },
      resolve: null,
      text: LEAVE_TEXT,
    },
  ],
});
