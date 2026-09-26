import { defineCard } from "../define.js";

// Any damage to an opponent, not only combat damage — a Specter that's
// dealt damage some other way (a fight) makes them discard too — and the
// card goes at random: the game picks, and nobody chooses.
const TRIGGER_TEXT =
  "Whenever Hypnotic Specter deals damage to an opponent, that player discards a card at random.";

export default defineCard({
  name: "Hypnotic Specter",
  manaCost: "{1}{B}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Specter"],
  power: 2,
  toughness: 2,
  keywords: ["flying"],
  text: `Flying\n${TRIGGER_TEXT}`,
  triggered: [
    {
      trigger: { on: "deals-damage", who: "self", to: "opponent" },
      targets: [],
      effect: { kind: "discard", target: "trigger-player", amount: 1, random: true },
      resolve: null,
      text: TRIGGER_TEXT,
    },
  ],
});
