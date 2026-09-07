import { defineCard } from "../define.js";

export default defineCard({
  name: "Rest in Peace",
  manaCost: "{1}{W}",
  colors: ["W"],
  types: ["enchantment"],
  // The printed card also exiles all cards already in graveyards as it enters;
  // that mass-exile clause waits on Phase 2's effect scopes.
  text: "If a card would be put into a graveyard from anywhere, exile it instead.",
  static: [
    {
      affects: { scope: "self" },
      replacement: { event: "would-be-put-into-graveyard", instead: "exile" },
      text: "If a card would be put into a graveyard from anywhere, exile it instead.",
    },
  ],
});
