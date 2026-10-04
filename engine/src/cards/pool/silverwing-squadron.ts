import { defineCard } from "../define.js";

// EDHREC rank 5040.
// Makes Knight → use "Knight Token".
//
// Rulings:
//   [2019-10-04] As long as Silverwing Squadron is on the battlefield, its ability will count
//     itself, so it'll be at least 1/1.
//   [2019-10-04] In a multiplayer game, opponents who have left the game aren't counted by
//     Silverwing Squadron's triggered ability.
//   [2019-10-04] The ability that defines Silverwing Squadron's power and toughness works in all
//     zones, not just the battlefield.

export default defineCard({
  name: "Silverwing Squadron",
  manaCost: "{5}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Human", "Knight"],
  power: 0,
  toughness: 0,
  keywords: ["flying", "vigilance"],
  text: "Flying, vigilance\nSilverwing Squadron's power and toughness are each equal to the number of creatures you control.\nWhenever this creature attacks, create a number of 2/2 white Knight creature tokens with vigilance equal to the number of opponents you have.",
  triggered: [
    {
      trigger: { on: "attacks", who: "self" },
      targets: [],
      // Opponents still in the game (the ruling) — Chittering Witch's count.
      effect: { kind: "create-token", token: "Knight Token", count: { countPlayers: "each-opponent" } },
      resolve: null,
      text: "Whenever this creature attacks, create a number of 2/2 white Knight creature tokens with vigilance equal to the number of opponents you have.",
    },
  ],
  static: [
    {
      // A characteristic-defining ability (rule 604.3): every zone, counting itself.
      affects: { scope: "self" },
      setBasePtFromCount: {
        countOf: { countOf: { type: "creature", controlledBy: "you" } },
        plusPower: 0,
        plusToughness: 0,
      },
      text: "Silverwing Squadron's power and toughness are each equal to the number of creatures you control.",
    },
  ],
});
