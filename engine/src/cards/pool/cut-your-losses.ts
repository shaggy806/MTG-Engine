import { defineCard } from "../define.js";

// The half is read as the spell resolves, so a copy aimed at the same player
// resolves first and the original then mills half of what's left (the
// ruling).
export default defineCard({
  name: "Cut Your Losses",
  manaCost: "{4}{U}{U}",
  colors: ["U"],
  types: ["sorcery"],
  casualty: 2,
  text:
    "Casualty 2 (As you cast this spell, you may sacrifice a creature with power 2 or greater. When you do, " +
    "copy this spell and you may choose a new target for the copy.)\n" +
    "Target player mills half their library, rounded down.",
  targets: ["player"],
  effect: { kind: "mill", target: 0, amount: { half: { librarySize: "each" }, round: "down" } },
});
