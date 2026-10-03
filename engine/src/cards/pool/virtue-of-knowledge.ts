import { defineCard } from "../define.js";

const TEXT =
  "If a permanent entering causes a triggered ability of a permanent you control to trigger, that ability " +
  "triggers an additional time.";

// An adventurer card (rule 715): Vantress Visions is the Adventure half. The
// doubling is Elesh Norn's first ability: the ability triggers again, it
// isn't copied, so each instance chooses its own modes and targets; it covers
// a permanent's own enters abilities and others' "whenever … enters",
// including ones caused by a permanent entering alongside Virtue itself, and
// leaves replacement effects and "as … enters" alone (the rulings). Two
// Virtues trigger it three times, not four.
export default defineCard({
  name: "Virtue of Knowledge",
  manaCost: "{4}{U}",
  colors: ["U"],
  types: ["enchantment"],
  text: TEXT,
  static: [
    {
      affects: { scope: "self" },
      doubleTriggers: { cause: "enters" },
      text: TEXT,
    },
  ],
  faces: ["Virtue of Knowledge", "Vantress Visions"],
  adventure: true,
});
