import { defineCard } from "../define.js";

// EDHREC rank 2977.

const ATTACK_TEXT =
  "10,000 Needles — Whenever this creature attacks, it gets +9999/+0 until end of turn.";

export default defineCard({
  name: "Jumbo Cactuar",
  manaCost: "{5}{G}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Plant"],
  power: 1,
  toughness: 7,
  text: ATTACK_TEXT,
  triggered: [
    {
      trigger: { on: "attacks", who: "self" },
      targets: [],
      effect: { kind: "modify-pt", target: "source", power: 9999, toughness: 0, duration: "end-of-turn" },
      resolve: null,
      text: ATTACK_TEXT,
    },
  ],
});
