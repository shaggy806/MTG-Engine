import { defineCard } from "../define.js";
import { equip, livingWeapon } from "../helpers.js";

const BONUS_TEXT = "Equipped creature gets +X/+X, where X is the greatest mana value among your commanders.";

// Wherever the commanders are (its ruling), read live; none is 0, and the
// Germ then dies to the state-based check.
export default defineCard({
  name: "Tangleweave Armor",
  manaCost: "{2}{G}{G}",
  colors: ["G"],
  types: ["artifact"],
  subtypes: ["Equipment"],
  text:
    "Living weapon (When this Equipment enters, create a 0/0 black Phyrexian Germ creature token, then attach this " +
    `to it.)\n${BONUS_TEXT}\nEquip {4}`,
  triggered: [livingWeapon()],
  static: [
    {
      affects: { scope: "attached" },
      grantPtPerCount: { commanderManaValue: "greatest", pt: [1, 1] },
      text: BONUS_TEXT,
    },
  ],
  activated: [equip("{4}")],
});
