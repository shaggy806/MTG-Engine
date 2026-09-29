import { defineCard } from "../define.js";
import { ward } from "../helpers.js";

const LEGENDARY_TEXT = "Legendary creatures you control get +2/+1 and have ward {1}.";
const OTHER_TEXT = "Nonlegendary creatures you control get +1/+1.";

export default defineCard({
  name: "Flowering of the White Tree",
  manaCost: "{W}{W}",
  colors: ["W"],
  supertypes: ["legendary"],
  types: ["enchantment"],
  text: `${LEGENDARY_TEXT}\n${OTHER_TEXT}`,
  static: [
    {
      affects: { scope: "filter", filter: { type: "creature", controlledBy: "you", supertype: "legendary" } },
      grantPt: [2, 1],
      grantsTriggered: [ward({ mana: "{1}" })],
      text: LEGENDARY_TEXT,
    },
    {
      affects: {
        scope: "filter",
        filter: { type: "creature", controlledBy: "you", notSupertype: "legendary" },
      },
      grantPt: [1, 1],
      text: OTHER_TEXT,
    },
  ],
});
