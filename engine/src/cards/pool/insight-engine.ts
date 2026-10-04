import { defineCard } from "../define.js";

// EDHREC rank 2422.
//
// Assemble the Legion's shape. If the artifact has left before this
// resolves, no counter is put on it and the draw reads the charge counters
// it last had on the battlefield (its ruling) — `countersOn: "source"`
// falls back to last-known information.
const TEXT = "{2}, {T}: Put a charge counter on this artifact, then draw a card for each charge counter on it.";

export default defineCard({
  name: "Insight Engine",
  manaCost: "{2}{U}",
  colors: ["U"],
  types: ["artifact"],
  text: TEXT,
  activated: [
    {
      cost: { mana: "{2}", tap: true },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "add-counter", target: "source", counter: "charge", amount: 1 },
          { kind: "draw", amount: { countersOn: "source", counter: "charge" } },
        ],
      },
      resolve: null,
      text: TEXT,
    },
  ],
});
