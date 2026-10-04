import { defineCard } from "../define.js";

// EDHREC rank 3425.

const GRANTED_TEXT = "Whenever this creature is dealt damage, put that many +1/+1 counters on it.";

export default defineCard({
  name: "Strength of Will",
  manaCost: "{1}{G}",
  colors: ["G"],
  types: ["instant"],
  text: `Until end of turn, target creature you control gains indestructible and "${GRANTED_TEXT}"`,
  targets: ["creature-you-control"],
  effect: {
    kind: "sequence",
    effects: [
      { kind: "grant-keyword", target: 0, keyword: "indestructible", duration: "end-of-turn" },
      {
        // Fake Your Own Death's one-shot grant; Power Fist's "that many"
        // counters on the creature holding it.
        kind: "grant-triggered",
        target: 0,
        duration: "end-of-turn",
        ability: {
          trigger: { on: "dealt-damage", who: "self" },
          targets: [],
          effect: { kind: "add-counter", target: "source", counter: "+1/+1", amount: { triggerValue: true } },
          resolve: null,
          text: GRANTED_TEXT,
        },
      },
    ],
  },
});
