import { defineCard } from "../define.js";

const TEXT = "As long as you have 30 or more life, this creature gets +5/+5 and has flying.";

export default defineCard({
  name: "Serra Ascendant",
  manaCost: "{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Human", "Monk"],
  power: 1,
  toughness: 1,
  keywords: ["lifelink"],
  text: `Lifelink (Damage dealt by this creature also causes you to gain that much life.)\n${TEXT}`,
  static: [
    {
      affects: { scope: "self" },
      condition: { kind: "life-total", who: "you", atLeast: 30 },
      grantPt: [5, 5],
      grantKeywords: ["flying"],
      text: TEXT,
    },
  ],
});
