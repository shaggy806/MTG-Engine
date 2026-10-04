import { defineCard } from "../define.js";

// EDHREC rank 2519.
//
// Rulings:
//   [2017-03-14] You must target an artifact or enchantment to cast Sundering Growth. If that
//     artifact or enchantment is an illegal target when Sundering Growth tries to resolve, it
//     won't resolve and none of its effects will happen. You won't populate.
//   [2024-01-12] Populate doesn't target the creature token you're copying. You choose that
//     creature token as you're taking the populate action. You can choose any creature token you
//     control.
//   [2024-01-12] If you control no creature tokens when you populate, nothing will happen.

export default defineCard({
  name: "Sundering Growth",
  manaCost: "{G/W}{G/W}",
  colors: ["W", "G"],
  types: ["instant"],
  text: "Destroy target artifact or enchantment, then populate. (Create a token that's a copy of a creature token you control.)",
  targets: ["artifact-or-enchantment"],
  effect: { kind: "sequence", effects: [{ kind: "destroy", target: 0 }, { kind: "populate" }] },
});
