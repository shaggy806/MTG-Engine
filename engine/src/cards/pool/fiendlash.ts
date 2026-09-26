import { defineCard } from "../define.js";
import { equip } from "../helpers.js";

const DAMAGE_TEXT =
  "Whenever equipped creature is dealt damage, it deals damage equal to its power to target player or planeswalker.";

// Its power as the ability resolves — as it last existed if the damage
// killed it, lifelink included (the rulings).
export default defineCard({
  name: "Fiendlash",
  manaCost: "{1}{R}",
  colors: ["R"],
  types: ["artifact"],
  subtypes: ["Equipment"],
  text: `Equipped creature gets +2/+0 and has reach.\n${DAMAGE_TEXT}\nEquip {2}{R}`,
  static: [
    {
      affects: { scope: "attached" },
      grantPt: [2, 0],
      grantKeywords: ["reach"],
      text: "Equipped creature gets +2/+0 and has reach.",
    },
  ],
  triggered: [
    {
      trigger: { on: "dealt-damage", who: "attached" },
      targets: ["player-or-planeswalker"],
      effect: { kind: "damage", amount: { powerOf: "trigger-object" }, target: 0, from: "trigger-object" },
      resolve: null,
      text: DAMAGE_TEXT,
    },
  ],
  activated: [equip("{2}{R}")],
});
