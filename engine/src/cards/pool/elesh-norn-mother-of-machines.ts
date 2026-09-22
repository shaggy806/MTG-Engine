import { defineCard } from "../define.js";

// Top-commanders rank 346. Both halves look only at who controls the triggered ability, never at who
// controls the entering permanent, and both count Elesh Norn's own entry (the
// 2023 rulings). Replacement effects and "as this enters" choices are
// untouched.
export default defineCard({
  name: "Elesh Norn, Mother of Machines",
  manaCost: "{4}{W}",
  colors: ["W"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Phyrexian", "Praetor"],
  power: 4,
  toughness: 7,
  keywords: ["vigilance"],
  text:
    "Vigilance\n" +
    "If a permanent entering causes a triggered ability of a permanent you control to trigger, that ability triggers an additional time.\n" +
    "Permanents entering don't cause abilities of permanents your opponents control to trigger.",
  static: [
    {
      affects: { scope: "self" },
      doubleTriggers: { cause: "enters" },
      text:
        "If a permanent entering causes a triggered ability of a permanent you control to trigger, that ability triggers an additional time.",
    },
    {
      affects: { scope: "self" },
      suppressEntryTriggers: "opponents",
      text: "Permanents entering don't cause abilities of permanents your opponents control to trigger.",
    },
  ],
});
