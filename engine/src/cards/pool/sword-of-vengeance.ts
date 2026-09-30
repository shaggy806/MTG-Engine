import { defineCard } from "../define.js";
import { equip } from "../helpers.js";

const TEXT = "Equipped creature gets +2/+0 and has first strike, vigilance, trample, and haste.";

export default defineCard({
  name: "Sword of Vengeance",
  manaCost: "{3}",
  types: ["artifact"],
  subtypes: ["Equipment"],
  text: `${TEXT}\nEquip {3}`,
  static: [
    {
      affects: { scope: "attached" },
      grantPt: [2, 0],
      grantKeywords: ["first-strike", "vigilance", "trample", "haste"],
      text: TEXT,
    },
  ],
  activated: [equip("{3}")],
});
