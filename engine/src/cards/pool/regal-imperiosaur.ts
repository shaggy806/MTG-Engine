import { defineCard } from "../define.js";

const LORD_TEXT = "Other Dinosaurs you control get +1/+1.";

export default defineCard({
  name: "Regal Imperiosaur",
  manaCost: "{1}{G}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Dinosaur"],
  power: 5,
  toughness: 4,
  text: LORD_TEXT,
  static: [
    {
      affects: { scope: "creatures-you-control", excludeSelf: true, subtype: "Dinosaur" },
      grantPt: [1, 1],
      text: LORD_TEXT,
    },
  ],
});
