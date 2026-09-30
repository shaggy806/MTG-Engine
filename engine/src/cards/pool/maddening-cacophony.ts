import { defineCard } from "../define.js";

// Kicked, the half is of each opponent's own library, read for each.
export default defineCard({
  name: "Maddening Cacophony",
  manaCost: "{1}{U}",
  colors: ["U"],
  types: ["sorcery"],
  text:
    "Kicker {3}{U} (You may pay an additional {3}{U} as you cast this spell.)\n" +
    "Each opponent mills eight cards. If this spell was kicked, instead each opponent mills half their library, rounded up.",
  effect: { kind: "mill", target: "each-opponent", amount: 8 },
  kicker: {
    cost: "{3}{U}",
    targets: [],
    effect: { kind: "mill", target: "each-opponent", amount: { half: { librarySize: "each" }, round: "up" } },
  },
});
