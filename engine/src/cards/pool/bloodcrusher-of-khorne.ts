import { defineCard } from "../define.js";

export default defineCard({
  name: "Bloodcrusher of Khorne",
  manaCost: "{3}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Demon", "Knight"],
  power: 3,
  toughness: 3,
  keywords: ["trample"],
  text: "Trample\nDevastating Charge — Other creatures you control have trample.",
  static: [
    {
      affects: { scope: "creatures-you-control", excludeSelf: true },
      grantKeywords: ["trample"],
      text: "Devastating Charge — Other creatures you control have trample.",
    },
  ],
});
