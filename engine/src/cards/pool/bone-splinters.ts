import { defineCard } from "../define.js";

// EDHREC rank 5987.
//
// Rulings:
//   [2022-09-09] Once you begin to cast Bone Splinters, no player may take actions until you’re
//     done. Notably, opponents can’t try to remove the creature you wish to sacrifice.
//   [2022-09-09] You must sacrifice exactly one creature to cast this spell; you can’t cast it
//     without sacrificing a creature, and you can’t sacrifice additional creatures.
//
// Worthy Cost's shape: a mandatory additional cost (rule 601.2f).
export default defineCard({
  name: "Bone Splinters",
  manaCost: "{B}",
  colors: ["B"],
  types: ["sorcery"],
  text: "As an additional cost to cast this spell, sacrifice a creature.\nDestroy target creature.",
  additionalCost: { sacrifice: { type: "creature" } },
  targets: ["creature"],
  effect: { kind: "destroy", target: 0 },
});
