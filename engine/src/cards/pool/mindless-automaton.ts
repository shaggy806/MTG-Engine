import { defineCard } from "../define.js";

// EDHREC rank 4787.
//
// Rulings:
//   [2020-11-10] If removing two +1/+1 counters from Mindless Automaton causes the amount of
//     damage already marked on Mindless Automaton to be equal to or greater than its toughness, it
//     will be put into its owner's graveyard as a state-based action before the ability can be
//     activated again and before the card is drawn.

const ENTER_TEXT = "This creature enters with two +1/+1 counters on it.";
const COUNTER_TEXT = "{1}, Discard a card: Put a +1/+1 counter on this creature.";
const DRAW_TEXT = "Remove two +1/+1 counters from this creature: Draw a card.";

export default defineCard({
  name: "Mindless Automaton",
  manaCost: "{4}",
  colors: [],
  types: ["artifact", "creature"],
  subtypes: ["Construct"],
  power: 0,
  toughness: 0,
  text: `${ENTER_TEXT}\n${COUNTER_TEXT}\n${DRAW_TEXT}`,
  static: [
    {
      affects: { scope: "self" },
      replacement: { event: "enters-battlefield", counters: { kind: "+1/+1", amount: 2 } },
      text: ENTER_TEXT,
    },
  ],
  activated: [
    {
      cost: { mana: "{1}", tap: false, discard: { count: 1 } },
      targets: [],
      effect: { kind: "add-counter", target: "source", counter: "+1/+1", amount: 1 },
      resolve: null,
      text: COUNTER_TEXT,
    },
    {
      cost: { mana: null, tap: false, removeCounter: { kind: "+1/+1", count: 2 } },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: DRAW_TEXT,
    },
  ],
});
