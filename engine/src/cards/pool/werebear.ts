import { defineCard } from "../define.js";
import { manaTapAbility } from "../helpers.js";

/**
 * ROADMAP Phase 11 EG-3 — a threshold conditional static (`condition:
 * "threshold"` — seven or more cards in your graveyard). Also carries a plain
 * `{T}: Add {G}` mana ability, unaffected by threshold.
 */
export default defineCard({
  name: "Werebear",
  manaCost: "{1}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Human", "Bear", "Druid"],
  power: 1,
  toughness: 1,
  text: "{T}: Add {G}.\nThreshold — Werebear gets +3/+3 as long as seven or more cards are in your graveyard.",
  activated: [manaTapAbility("G")],
  static: [
    {
      affects: { scope: "self" },
      condition: { kind: "threshold" },
      grantPt: [3, 3],
      text: "Threshold — Werebear gets +3/+3 as long as seven or more cards are in your graveyard.",
    },
  ],
});
