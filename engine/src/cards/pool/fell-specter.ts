import { defineCard } from "../define.js";

// EDHREC rank 4900.

const DISCARD_TEXT = "Whenever an opponent discards a card, that player loses 2 life.";

export default defineCard({
  name: "Fell Specter",
  manaCost: "{3}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Specter"],
  power: 1,
  toughness: 3,
  keywords: ["flying"],
  text: `Flying\nWhen this creature enters, target opponent discards a card.\n${DISCARD_TEXT}`,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: ["opponent"],
      effect: { kind: "discard", target: 0, amount: 1 },
      resolve: null,
      text: "When this creature enters, target opponent discards a card.",
    },
    // Megrim's trigger: once per card, "that player" the discarding player.
    {
      trigger: { on: "discards", who: "opponent", perCard: true },
      targets: [],
      effect: { kind: "lose-life", amount: 2, who: "trigger-controller" },
      resolve: null,
      text: DISCARD_TEXT,
    },
  ],
});
