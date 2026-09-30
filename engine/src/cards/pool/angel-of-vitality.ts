import { defineCard } from "../define.js";

const GAIN_TEXT = "If you would gain life, you gain that much life plus 1 instead.";
const PUMP_TEXT = "This creature gets +2/+2 as long as you have 25 or more life.";

export default defineCard({
  name: "Angel of Vitality",
  manaCost: "{2}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Angel"],
  power: 2,
  toughness: 2,
  keywords: ["flying"],
  text: `Flying\n${GAIN_TEXT}\n${PUMP_TEXT}`,
  static: [
    {
      affects: { scope: "self" },
      replacement: { event: "would-gain-life", who: "you", plus: 1 },
      text: GAIN_TEXT,
    },
    {
      affects: { scope: "self" },
      condition: { kind: "life-total", atLeast: 25 },
      grantPt: [2, 2],
      text: PUMP_TEXT,
    },
  ],
});
