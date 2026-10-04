import { defineCard } from "../define.js";

// EDHREC rank 5673.
//
// Rulings:
//   [2020-11-10] If the triggered ability that causes the monarch to draw a card goes on the stack
//     and a different player becomes the monarch before that ability resolves, the first player
//     will still draw the card.
//   [2020-11-10] The game starts with no monarch. Once an effect makes one player the monarch, the
//     game will have exactly one monarch from that point forward. As a player becomes the monarch,
//     the current monarch (if any) ceases being the monarch.
//   [2020-11-10] There are two inherent triggered abilities associated with being the monarch.
//     These triggered abilities have no source and are controlled by the player who was the
//     monarch at the time the abilities triggered. The full texts of these abilities are "At the
//     beginning of the monarch's end step, that player draws a card" and "Whenever a creature
//     deals combat damage to the monarch, its controller becomes the monarch."
//   [2020-11-10] If the monarch leaves the game during another player's turn, that player becomes
//     the monarch. If the monarch leaves the game during their turn, the next player in turn order
//     becomes the monarch.
//   [2020-11-10] Dawnglade Regent's second ability applies to itself while you're the monarch.
//   [2020-11-10] If combat damage dealt to the monarch causes that player to lose the game, the
//     triggered ability that causes the controller of the attacking creature to become the monarch
//     doesn't resolve. In most cases, the controller of the attacking creature will still become
//     the monarch as it is likely their turn.

export default defineCard({
  name: "Dawnglade Regent",
  manaCost: "{5}{G}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Elk"],
  power: 8,
  toughness: 8,
  text: "When this creature enters, you become the monarch.\nAs long as you're the monarch, permanents you control have hexproof.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: { kind: "become-monarch" },
      resolve: null,
      text: "When this creature enters, you become the monarch.",
    },
  ],
  static: [
    {
      // Itself included (the ruling), so no `excludeSelf`.
      affects: { scope: "filter", filter: { controlledBy: "you" } },
      condition: { kind: "monarch", who: "you" },
      grantKeywords: ["hexproof"],
      text: "As long as you're the monarch, permanents you control have hexproof.",
    },
  ],
});
