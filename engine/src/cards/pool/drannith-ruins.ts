import { defineCard } from "../define.js";

// EDHREC rank 5445.

const COUNTERS_TEXT = "{2}, {T}: Put two +1/+1 counters on target non-Human creature that entered this turn.";

export default defineCard({
  name: "Drannith Ruins",
  colors: [],
  types: ["land"],
  text: `{T}: Add {C}.\n${COUNTERS_TEXT}`,
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "C", amount: 1 },
      resolve: null,
      text: "{T}: Add {C}.",
    },
    {
      cost: { mana: "{2}", tap: true },
      targets: [
        { kind: "permanent", filter: { type: "creature", notSubtypes: ["Human"], enteredThisTurn: true } },
      ],
      effect: { kind: "add-counter", target: 0, counter: "+1/+1", amount: 2 },
      resolve: null,
      text: COUNTERS_TEXT,
    },
  ],
});
