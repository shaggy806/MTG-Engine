import { defineCard } from "../define.js";

// EDHREC rank 6071.
//
// Rulings:
//   [2025-10-02] If a spell's kicker cost was paid, the spell is "kicked."
//   [2025-10-02] If you copy a kicked spell on the stack, the copy is also kicked.
//   [2025-10-02] The kicker ability doesn't let you pay a kicker cost more than once.
//
// Burst Lightning's shape: the kicked effect replaces the unkicked one.
export default defineCard({
  name: "Firebending Lesson",
  manaCost: "{R}",
  colors: ["R"],
  types: ["instant"],
  subtypes: ["Lesson"],
  text: "Kicker {4} (You may pay an additional {4} as you cast this spell.)\nFirebending Lesson deals 2 damage to target creature. If this spell was kicked, it deals 5 damage to that creature instead.",
  targets: ["creature"],
  effect: { kind: "damage", amount: 2, target: 0 },
  kicker: { cost: "{4}", effect: { kind: "damage", amount: 5, target: 0 } },
});
