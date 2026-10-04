import { defineCard } from "../define.js";

// EDHREC rank 5701.
//
// Rulings:
//   [2013-06-07] Although originally printed with a characteristic-defining ability that defined
//     its color, this card now has a color indicator. This color indicator can't be affected by
//     text-changing effects (such as the one created by Crystal Spray), although color-changing
//     effects can still overwrite it.
//   [2021-03-19] If Slaughter Pact is countered or otherwise doesn't resolve (perhaps because its
//     target became illegal), the delayed triggered ability that threatens you with a game loss
//     won't trigger at the beginning of your next upkeep.
//   [2021-03-19] If Slaughter Pact resolves with a legal target but the target is not destroyed
//     (perhaps because it has indestructible or regenerated), the delayed triggered ability will
//     still trigger at the beginning of your next upkeep and you will have to pay the cost or lose
//     the game.

const UPKEEP = "At the beginning of your next upkeep, pay {2}{B}. If you don't, you lose the game.";

export default defineCard({
  name: "Slaughter Pact",
  manaCost: "{0}",
  colors: ["B"],
  types: ["instant"],
  text: `Destroy target nonblack creature.\n${UPKEEP}`,
  targets: ["nonblack-creature"],
  // Pact of Negation's shape: the delayed trigger is set up as the spell
  // resolves, even if the target isn't destroyed (the ruling), and never if
  // the spell doesn't resolve. Black by its colour indicator.
  effect: {
    kind: "sequence",
    effects: [
      { kind: "destroy", target: 0 },
      {
        kind: "delayed-trigger",
        at: "your-next-upkeep",
        effect: {
          kind: "unless",
          chooser: "you",
          options: [{ pay: "{2}{B}", text: "Pay {2}{B}." }],
          otherwise: { kind: "lose-game" },
        },
        text: UPKEEP,
      },
    ],
  },
});
