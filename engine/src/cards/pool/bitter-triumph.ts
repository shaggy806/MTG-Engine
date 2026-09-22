import { defineCard } from "../define.js";

// EDH backlog #839 — the card the "choice of additional costs" feature was
// built for. Each branch is a different *kind* of payment, which is what
// separates it from Deadly Dispute's "sacrifice an artifact or creature"
// (one cost, one filter spanning two types).
export default defineCard({
  name: "Bitter Triumph",
  manaCost: "{1}{B}",
  colors: ["B"],
  types: ["instant"],
  text:
    "As an additional cost to cast this spell, discard a card or pay 3 life.\n" +
    "Destroy target creature or planeswalker.",
  additionalCost: {
    options: [
      { text: "Discard a card", discard: 1 },
      { text: "Pay 3 life", payLife: 3 },
    ],
  },
  targets: [{ kind: "permanent", filter: { typesAnyOf: ["creature", "planeswalker"] } }],
  effect: { kind: "destroy", target: 0 },
});
