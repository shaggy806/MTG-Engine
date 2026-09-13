import { defineCard } from "../define.js";

/**
 * The EDH-popularity backlog's Tier-1 conditional-free-cast feature
 * (`CardDefinition.freeCastIf`, rule 601.2b-adjacent — a spell's own printed
 * "you may cast this without paying its mana cost" permission, gated by a
 * `StaticCondition` exactly like `selfCostReduction`'s, distinct from the
 * engine's existing cascade/suspend `castCardWithoutPaying` core). Needed a
 * new `CardFilter.isCommander` clause for "if you control a commander" —
 * the same `"controls"` `StaticCondition` kind every other conditional
 * ability (static/triggered/activated) already reads.
 */
export default defineCard({
  name: "Fierce Guardianship",
  manaCost: "{2}{U}",
  colors: ["U"],
  types: ["instant"],
  text:
    "If you control a commander, you may cast this spell without paying its mana cost.\n" +
    "Counter target noncreature spell.",
  freeCastIf: { condition: { kind: "controls", filter: { isCommander: true }, atLeast: 1 } },
  targets: ["noncreature-spell"],
  effect: { kind: "counter", target: 0 },
});
