import { defineCard } from "../define.js";

const FACES = ["Expansion // Explosion", "Expansion", "Explosion"];
const EXPANSION_TEXT =
  "Copy target instant or sorcery spell with mana value 4 or less. You may choose new targets for the copy.";

// A split card (rule 709): the whole card everywhere but the stack — both
// names, the combined mana cost (mana value 6), both halves' text — and one
// half or the other as a spell. Expansion copies a spell whose mana value,
// {X} included, is 4 or less.
export default defineCard({
  name: "Expansion",
  manaCost: "{U/R}{U/R}",
  colors: ["U", "R"],
  types: ["instant"],
  text: EXPANSION_TEXT,
  targets: [{ kind: "spell", filter: { typesAnyOf: ["instant", "sorcery"], manaValue: { op: "lte", n: 4 } } }],
  effect: { kind: "copy-spell", target: 0, newTargets: true },
  faces: FACES,
  split: true,
});
