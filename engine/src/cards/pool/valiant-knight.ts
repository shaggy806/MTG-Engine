import { defineCard } from "../define.js";

const ANTHEM_TEXT = "Other Knights you control get +1/+1.";
const STRIKE_TEXT = "{3}{W}{W}: Knights you control gain double strike until end of turn.";

export default defineCard({
  name: "Valiant Knight",
  manaCost: "{3}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Human", "Knight"],
  power: 3,
  toughness: 4,
  text: `${ANTHEM_TEXT}\n${STRIKE_TEXT}`,
  static: [
    {
      affects: { scope: "filter", filter: { type: "creature", subtype: "Knight", controlledBy: "you" }, excludeSelf: true },
      grantPt: [1, 1],
      text: ANTHEM_TEXT,
    },
  ],
  activated: [
    {
      cost: { mana: "{3}{W}{W}", tap: false },
      targets: [],
      // The Knights as it resolves (rule 611.2c); one arriving later doesn't.
      effect: {
        kind: "grant-keyword-all",
        filter: { type: "creature", subtype: "Knight", controlledBy: "you" },
        keyword: "double-strike",
        duration: "end-of-turn",
      },
      resolve: null,
      text: STRIKE_TEXT,
    },
  ],
});
