import { defineCard } from "../define.js";

export default defineCard({
  name: "Nylea's Forerunner",
  manaCost: "{4}{G}",
  colors: ["G"],
  types: ["enchantment", "creature"],
  subtypes: ["Beast"],
  power: 5,
  toughness: 3,
  keywords: ["trample"],
  text: "Trample\nOther creatures you control have trample.",
  static: [
    {
      affects: { scope: "creatures-you-control", excludeSelf: true },
      grantKeywords: ["trample"],
      text: "Other creatures you control have trample.",
    },
  ],
});
