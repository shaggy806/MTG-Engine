import { defineCard } from "../define.js";

const TEXT = "This creature gets +1/+1 for each land you control.";

export default defineCard({
  name: "Branch of Boseiju",
  art: "https://cards.scryfall.io/art_crop/back/1/1/1144014b-f13b-4397-97ed-a8de46371a2c.jpg",
  colors: ["G"],
  types: ["enchantment", "creature"],
  subtypes: ["Plant"],
  power: 0,
  toughness: 0,
  keywords: ["reach"],
  text: `Reach\n${TEXT}`,
  faces: ["Boseiju Reaches Skyward", "Branch of Boseiju"],
  transform: true,
  static: [
    {
      affects: { scope: "self" },
      grantPtPerCount: { filter: { type: "land", controlledBy: "you" }, pt: [1, 1] },
      text: TEXT,
    },
  ],
});
