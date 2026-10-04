import { defineCard } from "../define.js";

// EDHREC rank 6164.
//
// Rulings:
//   [2018-01-19] Oathsworn Vampire's last ability cares only whether you gained life in the turn,
//     even if Oathsworn Vampire wasn't in your graveyard when that happened. It doesn't care how
//     much you gained, whether you also lost life, or even whether you lost more life than you
//     gained.
//   [2018-01-19] Casting Oathsworn Vampire from your graveyard follows the normal rules for
//     casting that card. You must pay its costs, and you must follow all applicable timing rules.

export default defineCard({
  name: "Oathsworn Vampire",
  manaCost: "{1}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Vampire", "Knight"],
  power: 2,
  toughness: 2,
  text: "This creature enters tapped.\nYou may cast this card from your graveyard if you gained life this turn.",
  static: [
    {
      affects: { scope: "self" },
      replacement: { event: "enters-battlefield", tapped: true },
      text: "This creature enters tapped.",
    },
  ],
  // Gravecrawler's shape; the life gained this turn is a total of gains alone (the ruling).
  castFromGraveyardIf: { kind: "turn-stat", stat: "life-gained", who: "you", atLeast: 1 },
});
