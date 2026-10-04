import { defineCard } from "../define.js";

// EDHREC rank 2738.

export default defineCard({
  name: "Infectious Bite",
  manaCost: "{1}{G}",
  colors: ["G"],
  types: ["instant"],
  text: "Target creature you control deals damage equal to its power to target creature you don't control. Each opponent gets a poison counter.",
  targets: ["creature-you-control", "creature-an-opponent-controls"],
  effect: {
    kind: "sequence",
    effects: [
      { kind: "fight", a: 0, b: 1, oneSided: true },
      { kind: "add-player-counters", counter: "poison", amount: 1, who: "each-opponent" },
    ],
  },
});
