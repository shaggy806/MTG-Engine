import { defineCard } from "../define.js";
import { equip } from "../helpers.js";

const PUMP_TEXT = "Equipped creature gets +1/+1 for each color among permanents you control.";
const LOCK_TEXT =
  "As long as this Equipment is attached to a creature, your opponents can't cast spells during your turn.";

// Five colours at most (the ruling); moving it from one creature to another
// never leaves a gap in the lock.
export default defineCard({
  name: "Conqueror's Flail",
  manaCost: "{2}",
  colors: [],
  types: ["artifact"],
  subtypes: ["Equipment"],
  text: `${PUMP_TEXT}\n${LOCK_TEXT}\nEquip {2}`,
  static: [
    {
      affects: { scope: "attached" },
      grantPtPerCount: { colorsAmong: { controlledBy: "you" }, pt: [1, 1] },
      text: PUMP_TEXT,
    },
    {
      affects: { scope: "self" },
      condition: {
        kind: "all",
        of: [{ kind: "your-turn" }, { kind: "source", filter: { attachedTo: { type: "creature" } } }],
      },
      prohibits: { who: "opponents", spells: true },
      text: LOCK_TEXT,
    },
  ],
  activated: [equip("{2}")],
});
