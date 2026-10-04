import { defineCard } from "../define.js";

// EDHREC rank 5303.

const MORBID_TEXT =
  "Morbid — At the beginning of each end step, if a creature died this turn, put a +1/+1 counter on this creature.";

export default defineCard({
  name: "Vashta Nerada",
  manaCost: "{2}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Alien", "Horror"],
  power: 1,
  toughness: 1,
  keywords: ["indestructible", "shadow"],
  text: `Indestructible\nShadow (This creature can block or be blocked by only creatures with shadow.)\n${MORBID_TEXT}`,
  triggered: [
    {
      // Deathreap Ritual's morbid: any creature, anyone's, this turn.
      trigger: { on: "step-begins", step: "end", who: "any" },
      condition: { kind: "creature-died-this-turn" },
      targets: [],
      effect: { kind: "add-counter", target: "source", counter: "+1/+1", amount: 1 },
      resolve: null,
      text: MORBID_TEXT,
    },
  ],
});
