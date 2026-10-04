import { defineCard } from "../define.js";

// EDHREC rank 4201.
//
// Rulings:
//   [2025-11-17] If combat damage dealt to the monarch causes that player to lose the game, the
//     triggered ability that causes the controller of the attacking creature to become the monarch
//     doesn't resolve. In most cases, the controller of the attacking creature will still become
//     the monarch as it is likely their turn.
//   [2025-11-17] There are two inherent triggered abilities associated with being the monarch.
//     These triggered abilities have no source and are controlled by the player who was the
//     monarch at the time the abilities triggered. The full texts of these abilities are "At the
//     beginning of the monarch's end step, that player draws a card" and "Whenever a creature
//     deals combat damage to the monarch, its controller becomes the monarch."
//   [2025-11-17] If the monarch leaves the game during another player's turn, that player becomes
//     the monarch. If the monarch leaves the game during their turn, the next player in turn order
//     becomes the monarch.
//   [2025-11-17] If the triggered ability that causes the monarch to draw a card goes on the stack
//     and a different player becomes the monarch before that ability resolves, the first player
//     will still draw the card.
//   [2025-11-17] The game starts with no monarch. As a player becomes the monarch, the current
//     monarch (if any) ceases being the monarch. There is never more than one monarch at a time.

export default defineCard({
  name: "Grave Venerations",
  manaCost: "{3}{B}",
  colors: ["B"],
  types: ["enchantment"],
  text: "When this enchantment enters, you become the monarch.\nAt the beginning of your end step, if you're the monarch, return up to one target creature card from your graveyard to your hand.\nWhenever a creature you control dies, each opponent loses 1 life and you gain 1 life.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: { kind: "become-monarch" },
      resolve: null,
      text: "When this enchantment enters, you become the monarch.",
    },
    {
      trigger: { on: "step-begins", step: "end", who: "you" },
      condition: { kind: "monarch", who: "you" },
      targets: [{ kind: "optional", of: { kind: "card-in-graveyard", whose: "you", filter: { type: "creature" } } }],
      effect: { kind: "return-to-hand", target: 0, from: "graveyard" },
      resolve: null,
      text: "At the beginning of your end step, if you're the monarch, return up to one target creature card from your graveyard to your hand.",
    },
    {
      trigger: { on: "dies", who: "you-control", filter: { type: "creature" } },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "lose-life", amount: 1, who: "each-opponent" },
          { kind: "gain-life", amount: 1 },
        ],
      },
      resolve: null,
      text: "Whenever a creature you control dies, each opponent loses 1 life and you gain 1 life.",
    },
  ],
});
