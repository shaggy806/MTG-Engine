import { defineCard } from "../define.js";

// EDHREC rank 3484. Every player's abilities, the entering creature's own
// included; replacement effects and "as this enters" choices aren't
// triggers and are untouched (rule 614.12).
const TEXT = "Creatures entering don't cause abilities to trigger.";

export default defineCard({
  name: "Torpor Orb",
  manaCost: "{2}",
  colors: [],
  types: ["artifact"],
  text: TEXT,
  static: [
    {
      affects: { scope: "self" },
      suppressEntryTriggers: { who: "everyone", entering: { type: "creature" } },
      text: TEXT,
    },
  ],
});
