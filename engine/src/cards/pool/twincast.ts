import { defineCard } from "../define.js";

/**
 * ROADMAP Phase 8 — copy-a-spell. `copy-spell` mints a copy (rule 707.10) of
 * the targeted instant/sorcery on the stack, and its controller chooses which
 * of the copy's targets to change (`newTargets`, rule 707.10c).
 */
export default defineCard({
  name: "Twincast",
  manaCost: "{U}{U}",
  colors: ["U"],
  types: ["instant"],
  text: "Copy target instant or sorcery spell. You may choose new targets for the copy.",
  targets: ["instant-or-sorcery-spell"],
  effect: { kind: "copy-spell", target: 0, newTargets: true },
});
