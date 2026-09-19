import { defineCard } from "../define.js";

export default defineCard({
  name: "Rest in Peace",
  manaCost: "{1}{W}",
  colors: ["W"],
  types: ["enchantment"],
  text:
    "When Rest in Peace enters, exile all graveyards.\n" +
    "If a card or token would be put into a graveyard from anywhere, exile it instead.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: { kind: "exile-graveyard", target: "each-player" },
      resolve: null,
      text: "When Rest in Peace enters, exile all graveyards.",
    },
  ],
  static: [
    {
      affects: { scope: "self" },
      replacement: { event: "would-be-put-into-graveyard", instead: "exile" },
      text: "If a card or token would be put into a graveyard from anywhere, exile it instead.",
    },
  ],
});
