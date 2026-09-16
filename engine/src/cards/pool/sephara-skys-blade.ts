import { defineCard } from "../define.js";

export default defineCard({
  name: "Sephara, Sky's Blade",
  manaCost: "{4}{W}{W}{W}",
  colors: ["W"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Angel"],
  power: 7,
  toughness: 7,
  keywords: ["flying", "lifelink"],
  text:
    "You may pay {W} and tap four untapped creatures you control with flying rather than pay this spell's mana cost.\n" +
    "Flying, lifelink\n" +
    "Other creatures you control with flying have indestructible.",
  alternativeCost: {
    mana: "{W}",
    tapCreatures: { count: 4, filter: { type: "creature", keyword: "flying" } },
  },
  static: [
    {
      affects: {
        scope: "creatures-you-control",
        excludeSelf: true,
        withKeyword: "flying",
      },
      grantKeywords: ["indestructible"],
      text: "Other creatures you control with flying have indestructible.",
    },
  ],
});
