import { defineCard } from "../define.js";

// EDHREC rank 2714.
//
// Rulings:
//   [2021-04-16] If Blade Historian leaves the battlefield after first-strike combat damage has
//     been dealt but before regular combat damage (perhaps because it attacked and was destroyed
//     by first-strike combat damage), attacking creatures you control will lose double strike. A
//     creature without double strike won't deal regular combat damage if it already dealt
//     first-strike damage that turn.
const TEXT = "Attacking creatures you control have double strike.";

export default defineCard({
  name: "Blade Historian",
  manaCost: "{R/W}{R/W}{R/W}{R/W}",
  colors: ["W", "R"],
  types: ["creature"],
  subtypes: ["Human", "Cleric"],
  power: 2,
  toughness: 3,
  text: TEXT,
  static: [
    {
      affects: { scope: "filter", filter: { type: "creature", attacking: true, controlledBy: "you" } },
      grantKeywords: ["double-strike"],
      text: TEXT,
    },
  ],
});
