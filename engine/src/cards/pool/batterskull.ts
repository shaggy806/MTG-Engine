import { defineCard } from "../define.js";
import { equip, livingWeapon } from "../helpers.js";

const PUMP_TEXT = "Equipped creature gets +4/+4 and has vigilance and lifelink.";
const BOUNCE_TEXT = "{3}: Return this Equipment to its owner's hand.";

export default defineCard({
  name: "Batterskull",
  manaCost: "{5}",
  colors: [],
  types: ["artifact"],
  subtypes: ["Equipment"],
  text:
    "Living weapon (When this Equipment enters, create a 0/0 black Phyrexian Germ creature token, then attach this to it.)\n" +
    `${PUMP_TEXT}\n${BOUNCE_TEXT}\nEquip {5}`,
  triggered: [livingWeapon()],
  static: [
    {
      affects: { scope: "attached" },
      grantPt: [4, 4],
      grantKeywords: ["vigilance", "lifelink"],
      text: PUMP_TEXT,
    },
  ],
  activated: [
    {
      cost: { mana: "{3}", tap: false },
      targets: [],
      effect: { kind: "return-to-hand", target: "source" },
      resolve: null,
      text: BOUNCE_TEXT,
    },
    equip("{5}"),
  ],
});
