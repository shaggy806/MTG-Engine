import { defineCard } from "../define.js";

// Ulvenwald Oddity's back face.
const ANTHEM_TEXT = "Other creatures you control get +1/+1 and have trample and haste.";

export default defineCard({
  name: "Ulvenwald Behemoth",
  art: "https://cards.scryfall.io/art_crop/back/5/f/5fdf5fc4-69c8-4a59-9095-c2feefb64371.jpg",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Beast", "Horror"],
  power: 8,
  toughness: 8,
  keywords: ["trample", "haste"],
  text: `Trample, haste\n${ANTHEM_TEXT}`,
  faces: ["Ulvenwald Oddity", "Ulvenwald Behemoth"],
  transform: true,
  static: [
    {
      affects: { scope: "creatures-you-control", excludeSelf: true },
      grantPt: [1, 1],
      grantKeywords: ["trample", "haste"],
      text: ANTHEM_TEXT,
    },
  ],
});
