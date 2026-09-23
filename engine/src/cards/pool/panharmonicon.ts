import { defineCard } from "../define.js";

// `doubleTriggers` with `cause: "enters"` (the Elesh Norn, Mother of Machines
// shape) rather than `doubleEntryTriggers`: it doubles *any* trigger an
// entering causes, not only abilities written as `enters-battlefield`. The
// filter narrows the entering permanent to an artifact or creature; whose it
// is doesn't matter, only who controls the triggered ability (2021 ruling).
// Replacement effects and "as this enters" choices aren't triggers and are
// untouched.
export default defineCard({
  name: "Panharmonicon",
  manaCost: "{4}",
  types: ["artifact"],
  text:
    "If an artifact or creature entering causes a triggered ability of a permanent you control to trigger, that ability triggers an additional time.",
  static: [
    {
      affects: { scope: "self" },
      doubleTriggers: { cause: "enters", filter: { typesAnyOf: ["artifact", "creature"] } },
      text:
        "If an artifact or creature entering causes a triggered ability of a permanent you control to trigger, that ability triggers an additional time.",
    },
  ],
});
