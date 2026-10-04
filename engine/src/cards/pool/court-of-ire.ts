import { defineCard } from "../define.js";

// EDHREC rank 3300.
//
// Rulings:
//   [2020-11-10] There are two inherent triggered abilities associated with being the monarch.
//     These triggered abilities have no source and are controlled by the player who was the
//     monarch at the time the abilities triggered. The full texts of these abilities are "At the
//     beginning of the monarch's end step, that player draws a card" and "Whenever a creature
//     deals combat damage to the monarch, its controller becomes the monarch."
//   [2020-11-10] The game starts with no monarch. Once an effect makes one player the monarch, the
//     game will have exactly one monarch from that point forward. As a player becomes the monarch,
//     the current monarch (if any) ceases being the monarch.
//   [2020-11-10] If the triggered ability that causes the monarch to draw a card goes on the stack
//     and a different player becomes the monarch before that ability resolves, the first player
//     will still draw the card.
//   [2020-11-10] If the monarch leaves the game during another player's turn, that player becomes
//     the monarch. If the monarch leaves the game during their turn, the next player in turn order
//     becomes the monarch.
//   [2020-11-10] If combat damage dealt to the monarch causes that player to lose the game, the
//     triggered ability that causes the controller of the attacking creature to become the monarch
//     doesn't resolve. In most cases, the controller of the attacking creature will still become
//     the monarch as it is likely their turn.

export default defineCard({
  name: "Court of Ire",
  manaCost: "{3}{R}{R}",
  colors: ["R"],
  types: ["enchantment"],
  text: "When this enchantment enters, you become the monarch.\nAt the beginning of your upkeep, this enchantment deals 2 damage to any target. If you're the monarch, it deals 7 damage instead.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: { kind: "become-monarch" },
      resolve: null,
      text: "When this enchantment enters, you become the monarch.",
    },
    {
      trigger: { on: "step-begins", step: "upkeep", who: "you" },
      targets: ["any-target"],
      effect: {
        kind: "conditional",
        condition: { kind: "monarch", who: "you" },
        then: { kind: "damage", amount: 7, target: 0 },
        else: { kind: "damage", amount: 2, target: 0 },
      },
      resolve: null,
      text: "At the beginning of your upkeep, this enchantment deals 2 damage to any target. If you're the monarch, it deals 7 damage instead.",
    },
  ],
});
