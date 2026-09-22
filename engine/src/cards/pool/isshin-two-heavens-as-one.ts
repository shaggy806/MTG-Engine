import { defineCard } from "../define.js";

// Top-commanders rank 28. Doubles only triggers an attack causes — per-attacker
// ones and "whenever you attack" alike — not ones that follow from it, such as
// "whenever this becomes tapped" (the 2022 ruling). Each extra instance picks
// its own targets and modes.
export default defineCard({
  name: "Isshin, Two Heavens as One",
  manaCost: "{R}{W}{B}",
  colors: ["R", "W", "B"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Samurai"],
  power: 3,
  toughness: 4,
  text:
    "If a creature attacking causes a triggered ability of a permanent you control to trigger, that ability triggers an additional time.",
  static: [
    {
      affects: { scope: "self" },
      doubleTriggers: { cause: "attacks" },
      text:
        "If a creature attacking causes a triggered ability of a permanent you control to trigger, that ability triggers an additional time.",
    },
  ],
});
