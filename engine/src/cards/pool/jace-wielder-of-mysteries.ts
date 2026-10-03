import { defineCard } from "../define.js";

const REPLACE = "If you would draw a card while your library has no cards in it, you win the game instead.";
const PLUS = "+1: Target player mills two cards. Draw a card.";
const MINUS = "−8: Draw seven cards. Then if your library has no cards in it, you win the game.";

// The replacement is Laboratory Maniac's (`Game.drawCard`): while Jace is on
// the battlefield, a draw from an empty library wins instead. The −8's own
// check runs once the seven draws are done, so with Jace already gone (put
// into the graveyard for its loyalty) a short library still wins before
// state-based actions would make you lose for drawing from it (the ruling).
// The +1 mills first and then draws, so targeting yourself mills two and
// draws (the ruling); an illegal target makes the whole ability fizzle.
export default defineCard({
  name: "Jace, Wielder of Mysteries",
  manaCost: "{1}{U}{U}{U}",
  colors: ["U"],
  supertypes: ["legendary"],
  types: ["planeswalker"],
  subtypes: ["Jace"],
  loyalty: 4,
  text: `${REPLACE}\n${PLUS}\n${MINUS}`,
  static: [
    {
      affects: { scope: "self" },
      replacement: { event: "would-draw", who: "you", instead: "win-game", whileLibraryEmpty: true },
      text: REPLACE,
    },
  ],
  activated: [
    {
      loyaltyCost: 1,
      cost: { mana: null, tap: false },
      targets: ["player"],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "mill", target: 0, amount: 2 },
          { kind: "draw", amount: 1 },
        ],
      },
      resolve: null,
      text: PLUS,
    },
    {
      loyaltyCost: -8,
      cost: { mana: null, tap: false },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "draw", amount: 7 },
          {
            kind: "conditional",
            condition: { kind: "library-size", who: "you", atMost: 0 },
            then: { kind: "win-game" },
          },
        ],
      },
      resolve: null,
      text: MINUS,
    },
  ],
});
