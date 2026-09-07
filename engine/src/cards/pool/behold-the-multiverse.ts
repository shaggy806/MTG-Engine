import { defineCard } from "../define.js";

/**
 * ROADMAP Phase 6b — foretell. Cast from hand for `{3}{U}`, or foretell it for
 * `{2}` (exile face-down) and cast it from exile for `{1}{U}` on a later turn.
 */
export default defineCard({
  name: "Behold the Multiverse",
  manaCost: "{3}{U}",
  colors: ["U"],
  types: ["instant"],
  text: "Scry 2, then draw two cards.\nForetell {1}{U}",
  foretell: { cost: "{1}{U}" },
  effect: { kind: "scry", amount: 2, then: { kind: "draw", amount: 2 } },
});
