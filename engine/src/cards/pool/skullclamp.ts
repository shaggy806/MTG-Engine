import { defineCard } from "../define.js";
import { equip } from "../helpers.js";

const DIES_TEXT = "Whenever equipped creature dies, draw two cards.";

// A creature that dies to Skullclamp's own -1 toughness is still its host as
// it dies: the Equipment falls off only at the next state-based check.
export default defineCard({
  name: "Skullclamp",
  manaCost: "{1}",
  colors: [],
  types: ["artifact"],
  subtypes: ["Equipment"],
  text: `Equipped creature gets +1/-1.\n${DIES_TEXT}\nEquip {1}`,
  static: [{ affects: { scope: "attached" }, grantPt: [1, -1], text: "Equipped creature gets +1/-1." }],
  triggered: [
    {
      trigger: { on: "dies", who: "attached" },
      targets: [],
      effect: { kind: "draw", amount: 2 },
      resolve: null,
      text: DIES_TEXT,
    },
  ],
  activated: [equip("{1}")],
});
