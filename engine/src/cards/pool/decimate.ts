import { defineCard } from "../define.js";

// Four separate instances of "target", so a permanent with several of the
// types may fill more than one slot (the ruling) — no "other" relation.
export default defineCard({
  name: "Decimate",
  manaCost: "{2}{R}{G}",
  colors: ["R", "G"],
  types: ["sorcery"],
  text:
    "Destroy target artifact, target creature, target enchantment, and target land. (You can't cast this spell unless you have legal choices for all its targets.)",
  targets: ["artifact", "creature", "enchantment", "land"],
  effect: {
    kind: "sequence",
    simultaneous: true,
    effects: [
      { kind: "destroy", target: 0 },
      { kind: "destroy", target: 1 },
      { kind: "destroy", target: 2 },
      { kind: "destroy", target: 3 },
    ],
  },
});
