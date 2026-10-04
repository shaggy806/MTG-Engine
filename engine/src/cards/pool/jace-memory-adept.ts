import { defineCard } from "../define.js";

// EDHREC rank 6044.
//
// Rulings:
//   [2011-09-22] If you target yourself with Jace’s first ability, you’ll draw a card first, then
//     put the top card of your library into your graveyard.
//   [2011-09-22] If you activate Jace’s first ability, and the player is an illegal target when
//     the ability tries to resolve, it won’t resolve and none of its effects will happen. You
//     won’t draw a card.
//   [2011-09-22] If Jace’s third ability causes a player to draw more cards than are left in their
//     library, that player loses the game as a state-based action. If this ability causes all
//     players to do this, the game is a draw.

export default defineCard({
  name: "Jace, Memory Adept",
  manaCost: "{3}{U}{U}",
  colors: ["U"],
  supertypes: ["legendary"],
  types: ["planeswalker"],
  subtypes: ["Jace"],
  loyalty: 4,
  text: "+1: Draw a card. Target player mills a card.\n0: Target player mills ten cards.\n−7: Any number of target players each draw twenty cards.",
  activated: [
    {
      loyaltyCost: 1,
      cost: { mana: null, tap: false },
      targets: ["player"],
      effect: {
        kind: "sequence",
        effects: [{ kind: "draw", amount: 1 }, { kind: "mill", target: 0, amount: 1 }],
      },
      resolve: null,
      text: "+1: Draw a card. Target player mills a card.",
    },
    {
      loyaltyCost: 0,
      cost: { mana: null, tap: false },
      targets: ["player"],
      effect: { kind: "mill", target: 0, amount: 10 },
      resolve: null,
      text: "0: Target player mills ten cards.",
    },
    {
      loyaltyCost: -7,
      cost: { mana: null, tap: false },
      targets: [{ kind: "any-number", of: "player" }],
      effect: {
        kind: "for-each-target",
        from: 0,
        effect: { kind: "draw", target: 0, amount: 20 },
        simultaneous: true,
      },
      resolve: null,
      text: "−7: Any number of target players each draw twenty cards.",
    },
  ],
});
