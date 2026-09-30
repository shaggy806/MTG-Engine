import { defineCard } from "../define.js";
import { equip, ward } from "../helpers.js";

const STATIC_TEXT = "Equipped creature gets +1/+0 and has haste and ward {1}.";

export default defineCard({
  name: "Lavaspur Boots",
  manaCost: "{1}",
  types: ["artifact"],
  subtypes: ["Equipment"],
  text:
    `${STATIC_TEXT} (Whenever it becomes the target of a spell or ability an opponent controls, counter it unless that player pays {1}.)\n` +
    "Equip {1}",
  static: [
    {
      affects: { scope: "attached" },
      grantPt: [1, 0],
      grantKeywords: ["haste"],
      grantsTriggered: [ward({ mana: "{1}" })],
      text: STATIC_TEXT,
    },
  ],
  activated: [equip("{1}")],
});
