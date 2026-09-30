import { defineCard } from "../define.js";

// Modes are chosen as the spell is cast (rule 700.2a), so `castModal` even
// though neither mode targets.
export default defineCard({
  name: "Crux of Fate",
  manaCost: "{3}{B}{B}",
  colors: ["B"],
  types: ["sorcery"],
  text: "Choose one —\n• Destroy all Dragon creatures.\n• Destroy all non-Dragon creatures.",
  castModal: {
    minModes: 1,
    maxModes: 1,
    modes: [
      {
        text: "Destroy all Dragon creatures.",
        targets: [],
        effect: { kind: "destroy-all", filter: { type: "creature", subtype: "Dragon" } },
      },
      {
        text: "Destroy all non-Dragon creatures.",
        targets: [],
        effect: { kind: "destroy-all", filter: { type: "creature", notSubtypes: ["Dragon"] } },
      },
    ],
  },
});
