import { defineCard } from "../define.js";

// EDHREC rank 2544.
//
// Rulings:
//   [2017-09-29] Rampaging Ferocidon's last ability triggers whenever any player has a creature
//     enter the battlefield, including you.
//   [2017-09-29] If an effect says to set a player's life total to a number that's higher than the
//     player's current life total while Rampaging Ferocidon is on the battlefield, the player's
//     life total doesn't change.
//   [2017-09-29] Spells and abilities that cause players to gain life still resolve while
//     Rampaging Ferocidon is on the battlefield. No player will gain life, but any other effects
//     of that spell or ability will happen.
//   [2017-09-29] If another creature enters the battlefield at the same time as Rampaging
//     Ferocidon, its last ability triggers.
//
// "Players can't gain life" is The Lord of Pain's prevent over every player;
// a life total set higher goes through the same gain (`Game.changeLife`).

const LIFE_TEXT = "Players can't gain life.";
const PING_TEXT = "Whenever another creature enters, this creature deals 1 damage to that creature's controller.";

export default defineCard({
  name: "Rampaging Ferocidon",
  manaCost: "{2}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Dinosaur"],
  power: 3,
  toughness: 3,
  keywords: ["menace"],
  text: `Menace\n${LIFE_TEXT}\n${PING_TEXT}`,
  static: [
    {
      affects: { scope: "self" },
      replacement: { event: "would-gain-life", who: "any-player", prevent: true },
      text: LIFE_TEXT,
    },
  ],
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "any", filter: { type: "creature" }, otherOnly: true },
      targets: [],
      effect: { kind: "damage", amount: 1, who: "trigger-controller" },
      resolve: null,
      text: PING_TEXT,
    },
  ],
});
