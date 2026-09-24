import { defineCard } from "../define.js";

const TRIGGER_TEXT =
  "Whenever Finneas attacks, put a +1/+1 counter on each other creature you control that's a token or a Rabbit. " +
  "Then if creatures you control have total power 10 or greater, draw a card.";

export default defineCard({
  name: "Finneas, Ace Archer",
  manaCost: "{G}{W}",
  colors: ["G", "W"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Rabbit", "Archer"],
  power: 2,
  toughness: 2,
  keywords: ["vigilance", "reach"],
  text: `Vigilance, reach\n${TRIGGER_TEXT}`,
  triggered: [
    {
      trigger: { on: "attacks", who: "self" },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          {
            kind: "add-counter-all",
            filter: {
              type: "creature",
              controlledBy: "you",
              anyOf: [{ token: true }, { subtype: "Rabbit" }],
            },
            counter: "+1/+1",
            amount: 1,
            exceptSource: true,
          },
          {
            // Not an intervening-if: checked once, as the ability resolves,
            // after the counters — and Finneas's own power counts.
            kind: "conditional",
            condition: {
              kind: "aggregate",
              value: {
                aggregate: "sum",
                of: "power",
                filter: { type: "creature", controlledBy: "you" },
              },
              compare: { op: "gte", n: 10 },
            },
            then: { kind: "draw", amount: 1 },
          },
        ],
      },
      resolve: null,
      text: TRIGGER_TEXT,
    },
  ],
});
