import { defineCard } from "../define.js";

// EDHREC rank 3355.
//
// Rulings:
//   [2005-08-01] Goblin King now has the Goblin creature type and its ability has been reworded to
//     affect *other* Goblins. This means that if two Goblin Kings are on the battlefield, each
//     gives the other a bonus.

const TEXT = "Other Goblins get +1/+1 and have mountainwalk.";

export default defineCard({
  name: "Goblin King",
  manaCost: "{1}{R}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Goblin"],
  power: 2,
  toughness: 2,
  text: TEXT,
  static: [
    {
      // Every player's Goblins, not itself (Elvish Champion's shape).
      affects: { scope: "all-creatures", excludeSelf: true, subtype: "Goblin" },
      grantPt: [1, 1],
      grantKeywords: ["mountainwalk"],
      text: TEXT,
    },
  ],
});
