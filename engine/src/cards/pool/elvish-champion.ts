import { defineCard } from "../define.js";

// EDHREC rank 3101.
//
// Rulings:
//   [2004-10-04] It affects Elves controlled by all players, not just yours.
//   [2005-08-01] This card is now an Elf but has been reworded so that it does not give itself the
//     bonus.

const TEXT =
  "Other Elf creatures get +1/+1 and have forestwalk. (They can't be blocked as long as defending player controls a Forest.)";

export default defineCard({
  name: "Elvish Champion",
  manaCost: "{1}{G}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Elf"],
  power: 2,
  toughness: 2,
  text: TEXT,
  static: [
    {
      // Every player's Elves (the first ruling), not itself (the second).
      affects: { scope: "all-creatures", excludeSelf: true, subtype: "Elf" },
      grantPt: [1, 1],
      grantKeywords: ["forestwalk"],
      text: TEXT,
    },
  ],
});
