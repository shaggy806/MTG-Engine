import { defineCard } from "../define.js";

// EDHREC rank 3722.
//
// Rulings:
//   [2015-11-04] If a creature card has an ability that replaces going to the graveyard with
//     moving somewhere else "instead," that card won't count toward the number of Zombies you get.
//     Conversely, creature cards with a triggered ability that removes them from the graveyard
//     when they're put there from anywhere (or your library) will count toward that number.
//
// Counted as `put-into-graveyard` this way, not `milled`: a card a
// replacement sent elsewhere was never put into a graveyard (the ruling), and
// one a trigger takes out later was still put there.
export default defineCard({
  name: "Dread Summons",
  manaCost: "{X}{B}{B}",
  colors: ["B"],
  types: ["sorcery"],
  text: "Each player mills X cards. For each creature card put into a graveyard this way, you create a tapped 2/2 black Zombie creature token. (To mill a card, a player puts the top card of their library into their graveyard.)",
  effect: {
    kind: "sequence",
    effects: [
      { kind: "mill", target: "each-player", amount: "x" },
      {
        kind: "create-token",
        token: "Zombie Token",
        count: { thisWay: "put-into-graveyard", filter: { type: "creature" } },
        tapped: true,
      },
    ],
  },
});
