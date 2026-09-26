import { defineCard } from "../define.js";

export default defineCard({
  name: "Avacyn, Angel of Hope",
  manaCost: "{5}{W}{W}{W}",
  colors: ["W"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Angel"],
  power: 8,
  toughness: 8,
  keywords: ["flying", "vigilance", "indestructible"],
  text: "Flying, vigilance, indestructible\nOther permanents you control have indestructible.",
  static: [
    {
      affects: { scope: "filter", filter: { controlledBy: "you" }, excludeSelf: true },
      grantKeywords: ["indestructible"],
      text: "Other permanents you control have indestructible.",
    },
  ],
});
