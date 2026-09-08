import { defineCard } from "../define.js";

/**
 * ROADMAP Phase 11 EG-6 — a one-shot damage-prevention shield (rule 614.9).
 * The `prevent-damage` effect pushes a `PreventionShield` onto
 * `GameState.preventionShields`, which `dealDamage` consumes (and shrinks)
 * before a hit lands. Made-up (real "prevent the next N" cards are mostly
 * modal — Healing Salve — or attach to a source).
 */
export default defineCard({
  name: "Sunlit Bastion",
  manaCost: "{1}{W}",
  colors: ["W"],
  types: ["instant"],
  text: "Prevent the next 4 damage that would be dealt to any target this turn.",
  targets: ["any-target"],
  effect: { kind: "prevent-damage", target: 0, amount: 4 },
});
