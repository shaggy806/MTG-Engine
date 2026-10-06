import { defineCard } from "../define.js";

// EDHREC rank 6638.
//
// Rulings:
//   [2021-06-18] Casting a spell without paying its mana cost has no effect on its mana value.
//     Mogg Salvage's mana value is always 3.
//   [2021-06-18] To cast Mogg Salvage without paying its mana cost, any opponent may control an
//     Island, not just the one who controls the target artifact.
//   [2021-06-18] Who controls what lands is important only as you cast Mogg Salvage.
//
// Submerge's `freeCastIf`: offered beside the normal cast while both halves
// hold. Island and Mountain are land types, so any land with them counts.

export default defineCard({
  name: "Mogg Salvage",
  manaCost: "{2}{R}",
  colors: ["R"],
  types: ["instant"],
  text: "If an opponent controls an Island and you control a Mountain, you may cast this spell without paying its mana cost.\nDestroy target artifact.",
  freeCastIf: {
    condition: {
      kind: "all",
      of: [
        { kind: "opponent-controls", filter: { subtype: "Island" }, atLeast: 1 },
        { kind: "controls", filter: { subtype: "Mountain" }, atLeast: 1 },
      ],
    },
  },
  targets: ["artifact"],
  effect: { kind: "destroy", target: 0 },
});
