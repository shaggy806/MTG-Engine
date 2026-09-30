import { defineCard } from "../define.js";
import { ward } from "../helpers.js";

const WARD_TEXT = "Other artifacts you control have ward {2}.";
const CDA_TEXT = "Bronze Guardian's power is equal to the number of artifacts you control.";

export default defineCard({
  name: "Bronze Guardian",
  manaCost: "{4}{W}",
  colors: ["W"],
  types: ["artifact", "creature"],
  subtypes: ["Golem"],
  power: 0,
  toughness: 5,
  keywords: ["double-strike"],
  text:
    "Double strike\n" +
    "Ward {2} (Whenever this creature becomes the target of a spell or ability an opponent controls, counter it unless that player pays {2}.)\n" +
    `${WARD_TEXT}\n${CDA_TEXT}`,
  triggered: [ward({ mana: "{2}" })],
  static: [
    {
      affects: { scope: "filter", filter: { type: "artifact", controlledBy: "you" }, excludeSelf: true },
      grantsTriggered: [ward({ mana: "{2}" })],
      text: WARD_TEXT,
    },
    {
      affects: { scope: "self" },
      setBasePtFromCount: {
        countOf: { countOf: { type: "artifact", controlledBy: "you" } },
        plusPower: 0,
        plusToughness: 0,
        only: "power",
      },
      text: CDA_TEXT,
    },
  ],
});
