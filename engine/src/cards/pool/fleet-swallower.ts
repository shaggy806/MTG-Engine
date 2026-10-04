import { defineCard } from "../define.js";

// EDHREC rank 5000.
//
// Any player may be targeted, not only the one it attacks (its ruling). The
// half is read as the ability resolves, so two triggers each take half of
// what's left then (its ruling; Traumatize's shape, rounded up).
const ATTACK_TEXT = "Whenever this creature attacks, target player mills half their library, rounded up.";

export default defineCard({
  name: "Fleet Swallower",
  manaCost: "{5}{U}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Fish"],
  power: 6,
  toughness: 6,
  text: ATTACK_TEXT,
  triggered: [
    {
      trigger: { on: "attacks", who: "self" },
      targets: ["player"],
      effect: { kind: "mill", target: 0, amount: { half: { librarySize: "each" }, round: "up" } },
      resolve: null,
      text: ATTACK_TEXT,
    },
  ],
});
