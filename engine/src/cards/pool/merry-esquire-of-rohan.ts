import { defineCard } from "../define.js";

// EDHREC rank 4361.
//
// Rulings:
//   [2023-06-16] Merry and the other attacking legendary creature don't have to be attacking the
//     same player, planeswalker, or battle.

const STRIKE_TEXT = "Merry has first strike as long as it's equipped.";
const DRAW_TEXT = "Whenever you attack with Merry and another legendary creature, draw a card.";

export default defineCard({
  name: "Merry, Esquire of Rohan",
  manaCost: "{R}{W}",
  colors: ["W", "R"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Halfling", "Knight"],
  power: 2,
  toughness: 2,
  keywords: ["haste"],
  text: `Haste\n${STRIKE_TEXT}\n${DRAW_TEXT}`,
  static: [
    {
      affects: { scope: "self" },
      condition: { kind: "source", filter: { equipped: true } },
      grantKeywords: ["first-strike"],
      text: STRIKE_TEXT,
    },
  ],
  triggered: [
    {
      // Merry attacking, with another legendary creature you control among
      // the attackers just declared — part of the trigger condition, not an
      // intervening "if", so it isn't asked again as the ability resolves.
      trigger: { on: "attacks", who: "self" },
      whileCondition: {
        kind: "controls",
        filter: { type: "creature", supertype: "legendary", attacking: true },
        atLeast: 1,
        excludeSelf: true,
      },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: DRAW_TEXT,
    },
  ],
});
