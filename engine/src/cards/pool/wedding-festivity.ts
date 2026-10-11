import { defineCard } from "../define.js";

// The back face of Wedding Announcement (wedding-announcement.ts). White by
// its color indicator.
const TEXT = "Creatures you control get +1/+1.";

export default defineCard({
  name: "Wedding Festivity",
  art: "https://cards.scryfall.io/art_crop/back/4/e/4e6f365d-c5c4-4fd6-94cb-833b89239d73.jpg",
  colors: ["W"],
  types: ["enchantment"],
  text: `(Transforms from Wedding Announcement.)\n${TEXT}`,
  static: [{ affects: { scope: "creatures-you-control" }, grantPt: [1, 1], text: TEXT }],
  faces: ["Wedding Announcement", "Wedding Festivity"],
  transform: true,
});
