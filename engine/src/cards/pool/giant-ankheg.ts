import { defineCard } from "../define.js";
import { ward } from "../helpers.js";

// EDHREC rank 5165.

const OTHERS_TEXT = "Other creatures you control have trample and ward {2}.";

export default defineCard({
  name: "Giant Ankheg",
  manaCost: "{6}{G}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Insect"],
  power: 8,
  toughness: 8,
  keywords: ["trample"],
  text: `Trample\nWard {2} (Whenever this creature becomes the target of a spell or ability an opponent controls, counter it unless that player pays {2}.)\n${OTHERS_TEXT}`,
  static: [
    {
      affects: { scope: "creatures-you-control", excludeSelf: true },
      grantKeywords: ["trample"],
      grantsTriggered: [ward({ mana: "{2}" })],
      text: OTHERS_TEXT,
    },
  ],
  triggered: [ward({ mana: "{2}" })],
});
