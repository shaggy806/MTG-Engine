import { defineCard } from "../define.js";

export default defineCard({
  name: "Khenra Charioteer",
  manaCost: "{1}{R}{G}",
  colors: ["R", "G"],
  types: ["creature"],
  subtypes: ["Jackal", "Warrior"],
  power: 3,
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
