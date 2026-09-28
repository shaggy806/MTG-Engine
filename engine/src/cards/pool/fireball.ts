import { defineCard } from "../define.js";

// Any number of targets, zero included (the ruling: then it isn't a targeted
// spell and deals nothing), each beyond the first costing {1} more. The
// damage is divided among the targets still legal as it resolves.
export default defineCard({
  name: "Fireball",
  manaCost: "{X}{R}",
  colors: ["R"],
  types: ["sorcery"],
  text:
    "This spell costs {1} more to cast for each target beyond the first.\n" +
    "Fireball deals X damage divided evenly, rounded down, among any number of targets.",
  costPerExtraTarget: "{1}",
  targets: [{ kind: "any-number", of: "any-target" }],
  effect: { kind: "damage-divided-evenly", amount: "x", from: 0 },
});
