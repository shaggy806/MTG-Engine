import { defineCard } from "../define.js";

const HEXPROOF_TEXT = "You, planeswalkers you control, and other creatures you control have hexproof.";
const COUNTERS_TEXT = "{4}{G}{G}: Put a +1/+1 counter on each creature you control.";

export default defineCard({
  name: "Shalai, Voice of Plenty",
  manaCost: "{3}{W}",
  colors: ["W"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Angel"],
  power: 3,
  toughness: 4,
  keywords: ["flying"],
  text: `Flying\n${HEXPROOF_TEXT}\n${COUNTERS_TEXT}`,
  static: [
    { affects: { scope: "self" }, playerHexproof: true, text: HEXPROOF_TEXT },
    {
      affects: {
        scope: "filter",
        filter: { typesAnyOf: ["planeswalker", "creature"], controlledBy: "you" },
        excludeSelf: true,
      },
      grantKeywords: ["hexproof"],
      text: HEXPROOF_TEXT,
    },
  ],
  activated: [
    {
      cost: { mana: "{4}{G}{G}", tap: false },
      targets: [],
      effect: { kind: "add-counter-all", filter: { type: "creature", controlledBy: "you" }, counter: "+1/+1", amount: 1 },
      resolve: null,
      text: COUNTERS_TEXT,
    },
  ],
});
