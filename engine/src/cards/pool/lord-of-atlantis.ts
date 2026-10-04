import { defineCard } from "../define.js";

// EDHREC rank 5013.

const TEXT = "Other Merfolk get +1/+1 and have islandwalk. (They can't be blocked as long as defending player controls an Island.)";

// Every player's Merfolk, not itself (Goblin King's shape).
export default defineCard({
  name: "Lord of Atlantis",
  manaCost: "{U}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Merfolk"],
  power: 2,
  toughness: 2,
  text: TEXT,
  static: [
    {
      affects: { scope: "all-creatures", excludeSelf: true, subtype: "Merfolk" },
      grantPt: [1, 1],
      grantKeywords: ["islandwalk"],
      text: TEXT,
    },
  ],
});
