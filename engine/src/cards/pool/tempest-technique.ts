import { defineCard } from "../define.js";

const PUMP_TEXT = "Enchanted creature gets +1/+1 for each enchantment you control.";

// Storm on an Aura: each copy may get a new creature to enchant, and becomes
// a token Aura as it resolves (rule 608.3f) — one that wasn't "created".
export default defineCard({
  name: "Tempest Technique",
  manaCost: "{3}{W}",
  colors: ["W"],
  types: ["enchantment"],
  subtypes: ["Aura"],
  text:
    "Storm (When you cast this spell, copy it for each spell cast before it this turn. You may choose new targets for the copies. Copies become tokens.)\n" +
    `Enchant creature you control\n${PUMP_TEXT}`,
  targets: ["creature-you-control"],
  triggered: [
    {
      trigger: { on: "this-cast" },
      targets: [],
      effect: { kind: "storm" },
      resolve: null,
      text: "Storm — when you cast this spell, copy it for each spell cast before it this turn.",
    },
  ],
  static: [
    {
      affects: { scope: "attached" },
      grantPtPerCount: { filter: { type: "enchantment", controlledBy: "you" }, pt: [1, 1] },
      text: PUMP_TEXT,
    },
  ],
});
