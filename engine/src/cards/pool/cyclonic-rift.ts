import { defineCard } from "../define.js";

/**
 * The EDH-popularity backlog's Tier-1 Overload feature (rule 702.126 —
 * `CardDefinition.overload`, `Action.overload`): an alternative cost that
 * replaces the mana cost entirely and changes "target" to "each", taking no
 * targets. New `return-to-hand-all` `EffectSpec` for the overloaded mode.
 */
export default defineCard({
  name: "Cyclonic Rift",
  manaCost: "{1}{U}",
  colors: ["U"],
  types: ["instant"],
  text:
    "Return target nonland permanent you don't control to its owner's hand.\n" +
    "Overload {6}{U} (You may cast this spell for its overload cost. If you do, change \"target\" in its text to \"each.\")",
  targets: ["nonland-permanent-an-opponent-controls"],
  effect: { kind: "return-to-hand", target: 0 },
  overload: {
    cost: "{6}{U}",
    effect: {
      kind: "return-to-hand-all",
      filter: { notTypes: ["land"], controlledBy: "opponent" },
    },
  },
});
