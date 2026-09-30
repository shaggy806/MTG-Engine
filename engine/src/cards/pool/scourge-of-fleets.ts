import { defineCard } from "../define.js";

const TEXT =
  "When this creature enters, return each creature your opponents control with toughness X or less to its owner's hand, where X is the number of Islands you control.";

// X is read as the ability resolves.
export default defineCard({
  name: "Scourge of Fleets",
  manaCost: "{5}{U}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Kraken"],
  power: 6,
  toughness: 6,
  text: TEXT,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: {
        kind: "return-to-hand-all",
        filter: {
          type: "creature",
          controlledBy: "opponent",
          toughness: { op: "lte", n: { amount: { countOf: { subtype: "Island", controlledBy: "you" } } } },
        },
      },
      resolve: null,
      text: TEXT,
    },
  ],
});
