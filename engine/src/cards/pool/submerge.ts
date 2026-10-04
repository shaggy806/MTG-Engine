import { defineCard } from "../define.js";

// EDHREC rank 4292.
// The free cast is `freeCastIf` (Fierce Guardianship's shape) on both halves
// of the condition at once; it's offered beside the normal cast while they
// hold. Forest and Island are land types, so any land with them counts.

export default defineCard({
  name: "Submerge",
  manaCost: "{4}{U}",
  colors: ["U"],
  types: ["instant"],
  text: "If an opponent controls a Forest and you control an Island, you may cast this spell without paying its mana cost.\nPut target creature on top of its owner's library.",
  freeCastIf: {
    condition: {
      kind: "all",
      of: [
        { kind: "opponent-controls", filter: { subtype: "Forest" }, atLeast: 1 },
        { kind: "controls", filter: { subtype: "Island" }, atLeast: 1 },
      ],
    },
  },
  targets: ["creature"],
  effect: { kind: "put-on-library", target: 0, position: "top" },
});
