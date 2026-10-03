import { defineCard } from "../define.js";

const HAND = "Your maximum hand size is twenty.";
const GROW = "Whenever you attack with two or more creatures, put a +1/+1 counter on this creature and draw a card.";
const WIN =
  "Whenever this creature attacks, you win the game if there are twenty or more counters on it or you have twenty or more cards in hand.";

// The hand size applies in timestamp order with every other hand-size effect
// (rule 613.11 — the ruling: a Spellbook that arrived later still gives no
// maximum). The attack trigger always triggers, and its "if" is only a
// question as it resolves (the ruling): counters of every kind count, read
// as it last existed if it has left the battlefield.
export default defineCard({
  name: "Twenty-Toed Toad",
  manaCost: "{3}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Frog", "Wizard"],
  power: 3,
  toughness: 3,
  text: `${HAND}\n${GROW}\n${WIN}`,
  static: [{ affects: { scope: "self" }, maxHandSize: { who: "you", set: 20 }, text: HAND }],
  triggered: [
    {
      trigger: { on: "attack-with", who: "you", atLeast: 2 },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "add-counter", target: "source", counter: "+1/+1", amount: 1 },
          { kind: "draw", amount: 1 },
        ],
      },
      resolve: null,
      text: GROW,
    },
    {
      trigger: { on: "attacks", who: "self" },
      targets: [],
      effect: {
        kind: "conditional",
        // "Twenty or more counters on it, or twenty or more cards in hand."
        condition: {
          kind: "not",
          of: {
            kind: "all",
            of: [
              { kind: "not", of: { kind: "self-counters", compare: { op: "gte", n: 20 } } },
              { kind: "not", of: { kind: "hand-size", atLeast: 20 } },
            ],
          },
        },
        then: { kind: "win-game" },
      },
      resolve: null,
      text: WIN,
    },
  ],
});
