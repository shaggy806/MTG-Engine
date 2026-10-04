import { defineCard } from "../define.js";

// EDHREC rank 6394.
// The CDA works in every zone (2023-09-01 ruling) — `setBasePtFromCount`, as
// Ashaya, Soul of the Wild's.

const TEXT =
  "Regal Bunnicorn's power and toughness are each equal to the number of nonland permanents you control.";

export default defineCard({
  name: "Regal Bunnicorn",
  manaCost: "{1}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Rabbit", "Unicorn"],
  power: 0,
  toughness: 0,
  text: TEXT,
  static: [
    {
      affects: { scope: "self" },
      setBasePtFromCount: {
        countOf: { countOf: { notTypes: ["land"], controlledBy: "you" } },
        plusPower: 0,
        plusToughness: 0,
      },
      text: TEXT,
    },
  ],
});
