import { defineCard } from "../define.js";

// The copy is made first, from the spell as it is, and then the spell goes
// back to its owner's hand — not countered, so "can't be countered" doesn't
// stop it, and a copy returned this way simply ceases to exist (the rulings).
export default defineCard({
  name: "Narset's Reversal",
  manaCost: "{U}{U}",
  colors: ["U"],
  types: ["instant"],
  text: "Copy target instant or sorcery spell, then return it to its owner's hand. You may choose new targets for the copy.",
  targets: ["instant-or-sorcery-spell"],
  effect: {
    kind: "sequence",
    effects: [
      { kind: "copy-spell", target: 0, newTargets: true },
      { kind: "return-to-hand", target: 0, from: "stack" },
    ],
  },
});
