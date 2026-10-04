import { defineCard } from "../define.js";

// EDHREC rank 4080.
//
// Rulings:
//   [2020-11-10] There are two inherent triggered abilities associated with being the monarch.
//     These triggered abilities have no source and are controlled by the player who was the
//     monarch at the time the abilities triggered. The full texts of these abilities are "At the
//     beginning of the monarch's end step, that player draws a card" and "Whenever a creature
//     deals combat damage to the monarch, its controller becomes the monarch."
//   [2020-11-10] Emberwilde Captain's last ability won't trigger if an opponent attacks only
//     planeswalkers you control and not you.
//   [2020-11-10] If combat damage dealt to the monarch causes that player to lose the game, the
//     triggered ability that causes the controller of the attacking creature to become the monarch
//     doesn't resolve. In most cases, the controller of the attacking creature will still become
//     the monarch as it is likely their turn.
//   [2020-11-10] If another player becomes the monarch after Emberwilde Captain's last ability
//     triggers but before it resolves, the ability will resolve as normal. The player who attacked
//     you will be dealt damage, even if that player was the one who became the monarch.
//   [2020-11-10] If the triggered ability that causes the monarch to draw a card goes on the stack
//     and a different player becomes the monarch before that ability resolves, the first player
//     will still draw the card.
//   [2020-11-10] Emberwilde Captain's last ability triggers once for each player who attacks you,
//     no matter how many creatures they attack with beyond the first.
//   [2020-11-10] If the monarch leaves the game during another player's turn, that player becomes
//     the monarch. If the monarch leaves the game during their turn, the next player in turn order
//     becomes the monarch.
//   [2020-11-10] The game starts with no monarch. Once an effect makes one player the monarch, the
//     game will have exactly one monarch from that point forward. As a player becomes the monarch,
//     the current monarch (if any) ceases being the monarch.

export default defineCard({
  name: "Emberwilde Captain",
  manaCost: "{3}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Djinn", "Pirate"],
  power: 4,
  toughness: 2,
  text: "When this creature enters, you become the monarch.\nWhenever an opponent attacks you while you're the monarch, this creature deals damage to that player equal to the number of cards in their hand.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: { kind: "become-monarch" },
      resolve: null,
      text: "When this creature enters, you become the monarch.",
    },
    {
      // "While you're the monarch" is part of the trigger condition (rule
      // 603.1), checked only as the attack is declared: it resolves even if
      // someone else is the monarch by then (the ruling). Once per player
      // attacking you, not per creature, and not for an attack on your
      // planeswalkers only (the rulings). The attacking player is the active
      // player; their hand is counted as it resolves.
      trigger: { on: "attacks-player", who: "opponent", defender: "you" },
      whileCondition: { kind: "monarch", who: "you" },
      targets: [],
      effect: { kind: "damage", amount: { cardsInHand: "active-player" }, who: "active-player" },
      resolve: null,
      text: "Whenever an opponent attacks you while you're the monarch, this creature deals damage to that player equal to the number of cards in their hand.",
    },
  ],
});
