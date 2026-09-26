import { defineCard } from "../define.js";
import { equip } from "../helpers.js";

const ATTACK_TEXT = "Whenever equipped creature attacks, destroy target creature an opponent controls.";

export default defineCard({
  name: "Ultima Weapon",
  manaCost: "{7}",
  colors: [],
  supertypes: ["legendary"],
  types: ["artifact"],
  subtypes: ["Equipment"],
  text: `${ATTACK_TEXT}\nEquipped creature gets +7/+7.\nEquip {7}`,
  static: [{ affects: { scope: "attached" }, grantPt: [7, 7], text: "Equipped creature gets +7/+7." }],
  triggered: [
    {
      trigger: { on: "attacks", who: "attached" },
      targets: ["creature-an-opponent-controls"],
      effect: { kind: "destroy", target: 0 },
      resolve: null,
      text: ATTACK_TEXT,
    },
  ],
  activated: [equip("{7}")],
});
