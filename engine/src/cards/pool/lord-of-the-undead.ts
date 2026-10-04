import { defineCard } from "../define.js";

// EDHREC rank 3584.
//
// Rulings:
//   [2005-08-01] Lord of the Undead now has the Zombie creature type and its first ability has
//     been reworded to affect *other* Zombies. This means that if two Lord of the Undead are on
//     the battlefield, each gives the other a bonus.

const LORD_TEXT = "Other Zombie creatures get +1/+1.";
const RETURN_TEXT = "{1}{B}, {T}: Return target Zombie card from your graveyard to your hand.";

export default defineCard({
  name: "Lord of the Undead",
  manaCost: "{1}{B}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Zombie"],
  power: 2,
  toughness: 2,
  text: `${LORD_TEXT}\n${RETURN_TEXT}`,
  static: [
    {
      // Every player's Zombie creatures, not just yours.
      affects: { scope: "filter", filter: { type: "creature", subtype: "Zombie" }, excludeSelf: true },
      grantPt: [1, 1],
      text: LORD_TEXT,
    },
  ],
  activated: [
    {
      cost: { mana: "{1}{B}", tap: true },
      targets: [{ kind: "card-in-graveyard", whose: "you", filter: { subtype: "Zombie" } }],
      effect: { kind: "return-to-hand", target: 0, from: "graveyard" },
      resolve: null,
      text: RETURN_TEXT,
    },
  ],
});
