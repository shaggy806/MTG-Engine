import { defineCard } from "../define.js";

// Twincast in red. Any instant or sorcery spell, whoever controls it and
// whether or not it has targets (the rulings); the copy keeps its modes, X
// and the costs paid for it, and isn't cast.
export default defineCard({
  name: "Reverberate",
  manaCost: "{R}{R}",
  colors: ["R"],
  types: ["instant"],
  text: "Copy target instant or sorcery spell. You may choose new targets for the copy.",
  targets: ["instant-or-sorcery-spell"],
  effect: { kind: "copy-spell", target: 0, newTargets: true },
});
