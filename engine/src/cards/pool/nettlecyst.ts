import { defineCard } from "../define.js";
import { equip, livingWeapon } from "../helpers.js";

const PUMP_TEXT = "Equipped creature gets +1/+1 for each artifact and/or enchantment you control.";

// A permanent that's both an artifact and an enchantment counts once (the
// ruling).
export default defineCard({
  name: "Nettlecyst",
  manaCost: "{3}",
  colors: [],
  types: ["artifact"],
  subtypes: ["Equipment"],
  text:
    "Living weapon (When this Equipment enters, create a 0/0 black Phyrexian Germ creature token, then attach this to it.)\n" +
    `${PUMP_TEXT}\nEquip {2}`,
  triggered: [livingWeapon()],
  static: [
    {
      affects: { scope: "attached" },
      grantPtPerCount: { filter: { typesAnyOf: ["artifact", "enchantment"], controlledBy: "you" }, pt: [1, 1] },
      text: PUMP_TEXT,
    },
  ],
  activated: [equip("{2}")],
});
