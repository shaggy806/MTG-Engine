import { defineCard } from "../define.js";
import { equip } from "../helpers.js";

const ATTACK_TEXT = "Whenever equipped creature attacks, destroy target permanent.";

export default defineCard({
  name: "Argentum Armor",
  manaCost: "{6}",
  colors: [],
  types: ["artifact"],
  subtypes: ["Equipment"],
  text: `Equipped creature gets +6/+6.\n${ATTACK_TEXT}\nEquip {6}`,
  static: [{ affects: { scope: "attached" }, grantPt: [6, 6], text: "Equipped creature gets +6/+6." }],
  triggered: [
    {
      trigger: { on: "attacks", who: "attached" },
      targets: ["permanent"],
      effect: { kind: "destroy", target: 0 },
      resolve: null,
      text: ATTACK_TEXT,
    },
  ],
  activated: [equip("{6}")],
});
