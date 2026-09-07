import { defineCard } from "../define.js";

/**
 * ROADMAP Phase 8 — copy-a-spell. `copy-spell` mints a copy (rule 707.10) of
 * the targeted instant/sorcery on the stack, keeping its targets. The "you may
 * choose new targets" clause isn't offered (declining is legal).
 */
export default defineCard({
  name: "Twincast",
  manaCost: "{U}{U}",
  colors: ["U"],
  types: ["instant"],
  text: "Copy target instant or sorcery spell. You may choose new targets for the copy.",
  targets: ["instant-or-sorcery-spell"],
  effect: { kind: "copy-spell", target: 0 },
});
