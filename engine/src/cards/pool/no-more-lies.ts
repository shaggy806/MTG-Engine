import { defineCard } from "../define.js";

// EDHREC rank 5909.

export default defineCard({
  name: "No More Lies",
  manaCost: "{W}{U}",
  colors: ["W", "U"],
  types: ["instant"],
  text: "Counter target spell unless its controller pays {3}. If that spell is countered this way, exile it instead of putting it into its owner's graveyard.",
  targets: ["spell"],
  // Syncopate's shape, with a fixed {3} (Dazzling Denial's `pay`).
  effect: {
    kind: "unless",
    chooser: 0,
    options: [{ pay: "{3}", text: "Pay {3}." }],
    otherwise: { kind: "counter", target: 0, into: "exile" },
  },
});
