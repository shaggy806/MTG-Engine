import { defineCard } from "../define.js";
import { equip } from "../helpers.js";

// EDHREC rank 3451.

const STATIC_TEXT = "Equipped creature can't be blocked except by Walls.";

export default defineCard({
  name: "Prowler's Helm",
  manaCost: "{2}",
  colors: [],
  types: ["artifact"],
  subtypes: ["Equipment"],
  text: `${STATIC_TEXT}\nEquip {2}`,
  static: [
    {
      affects: { scope: "attached" },
      cantBeBlockedBy: { notSubtypes: ["Wall"] },
      text: STATIC_TEXT,
    },
  ],
  activated: [equip("{2}")],
});
