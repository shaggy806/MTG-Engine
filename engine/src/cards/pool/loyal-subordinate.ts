import { defineCard } from "../define.js";

const CONTROLS_COMMANDER = {
  kind: "controls",
  filter: { isCommander: true, controlledBy: "you" },
  atLeast: 1,
} as const;

export default defineCard({
  name: "Loyal Subordinate",
  manaCost: "{2}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Zombie"],
  power: 3,
  toughness: 1,
  keywords: ["menace"],
  text:
    "Menace\n" +
    "Lieutenant — At the beginning of combat on your turn, if you control your commander, each opponent loses 3 life.",
  triggered: [
    {
      trigger: { on: "step-begins", step: "begin-combat", who: "you" },
      // "if you control your commander" is an intervening-if (603.4), so it
      // is checked both on trigger and again on resolution.
      condition: CONTROLS_COMMANDER,
      targets: [],
      effect: { kind: "lose-life", amount: 3, who: "each-opponent" },
      resolve: null,
      text: "Lieutenant — At the beginning of combat on your turn, if you control your commander, each opponent loses 3 life.",
    },
  ],
});
