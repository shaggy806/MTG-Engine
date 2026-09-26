import { defineCard } from "../define.js";
import { equip, ward } from "../helpers.js";

const STATIC_TEXT = "Equipped creature has flying and ward {4}.";

export default defineCard({
  name: "Winged Boots",
  manaCost: "{1}{U}",
  colors: ["U"],
  types: ["artifact"],
  subtypes: ["Equipment"],
  text:
    `${STATIC_TEXT} (Whenever equipped creature becomes the target of a spell or ability an opponent controls, counter it unless that player pays {4}.)\n` +
    "Equip {1}",
  static: [
    {
      affects: { scope: "attached" },
      grantKeywords: ["flying"],
      grantsTriggered: [ward({ mana: "{4}" })],
      text: STATIC_TEXT,
    },
  ],
  activated: [equip("{1}")],
});
