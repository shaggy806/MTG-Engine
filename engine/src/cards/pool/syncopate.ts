import { defineCard } from "../define.js";

// EDHREC rank 3785. Jwari Disruption's "unless its controller pays", with
// Esper Sentinel's generic amount read off this spell's X, and Transcendent
// Dragon's counter into exile.

export default defineCard({
  name: "Syncopate",
  manaCost: "{X}{U}",
  colors: ["U"],
  types: ["instant"],
  text: "Counter target spell unless its controller pays {X}. If that spell is countered this way, exile it instead of putting it into its owner's graveyard.",
  targets: ["spell"],
  effect: {
    kind: "unless",
    chooser: 0,
    options: [{ payGeneric: "x", text: "Pay {X}." }],
    otherwise: { kind: "counter", target: 0, into: "exile" },
  },
});
