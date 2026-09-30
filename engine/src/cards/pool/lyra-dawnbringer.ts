import { defineCard } from "../define.js";

const TEXT = "Other Angels you control get +1/+1 and have lifelink.";

export default defineCard({
  name: "Lyra Dawnbringer",
  manaCost: "{3}{W}{W}",
  colors: ["W"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Angel"],
  power: 5,
  toughness: 5,
  keywords: ["flying", "first-strike", "lifelink"],
  text: `Flying\nFirst strike\nLifelink\n${TEXT}`,
  static: [
    {
      affects: { scope: "filter", filter: { type: "creature", subtype: "Angel", controlledBy: "you" }, excludeSelf: true },
      grantPt: [1, 1],
      grantKeywords: ["lifelink"],
      text: TEXT,
    },
  ],
});
