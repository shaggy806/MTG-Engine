import { defineCard } from "../define.js";

const TEXT = "At the beginning of your upkeep, you gain 1 life for each card in your hand.";

export default defineCard({
  name: "Venser's Journal",
  manaCost: "{5}",
  types: ["artifact"],
  subtypes: ["Book"],
  text: `You have no maximum hand size.\n${TEXT}`,
  static: [{ affects: { scope: "self" }, noMaxHandSize: true, text: "You have no maximum hand size." }],
  triggered: [
    {
      trigger: { on: "step-begins", step: "upkeep", who: "you" },
      targets: [],
      effect: { kind: "gain-life", amount: { cardsInHand: "you" } },
      resolve: null,
      text: TEXT,
    },
  ],
});
