import { defineCard } from "../define.js";
import { equip } from "../helpers.js";

const DAMAGE_TEXT = "Whenever equipped creature deals combat damage to a player, create a token that's a copy of this Equipment.";

// The copy has all three abilities and enters unattached (the rulings).
export default defineCard({
  name: "Bloodforged Battle-Axe",
  manaCost: "{1}",
  colors: [],
  types: ["artifact"],
  subtypes: ["Equipment"],
  text: `Equipped creature gets +2/+0.\n${DAMAGE_TEXT}\nEquip {2}`,
  static: [{ affects: { scope: "attached" }, grantPt: [2, 0], text: "Equipped creature gets +2/+0." }],
  triggered: [
    {
      trigger: { on: "deals-combat-damage-to-player", who: "attached" },
      targets: [],
      effect: { kind: "create-token-copy", of: "source", count: 1 },
      resolve: null,
      text: DAMAGE_TEXT,
    },
  ],
  activated: [equip("{2}")],
});
