import { defineCard } from "../define.js";

// EDHREC rank 5298.
//
// Rulings:
//   [2024-11-08] Raid abilities care only that you attacked with a creature. It doesn't matter how
//     many creatures you attacked with or which player, planeswalker, or battle those creatures
//     attacked.
//   [2024-11-08] Raid abilities evaluate the entire turn to see if you attacked with a creature.
//     That creature doesn't have to still be on the battlefield. Similarly, the player,
//     planeswalker, or battle it attacked doesn't have to still be in the game or on the
//     battlefield.
//   [2024-11-08] Some raid abilities trigger at the beginning of your end step. These abilities
//     trigger if you attacked with a creature that turn, even if the permanent with that raid
//     ability wasn't on the battlefield when you attacked.

const LOSS_TEXT = "Whenever an opponent discards a card, that player loses 2 life.";
const RAID_TEXT = "Raid — At the beginning of your end step, if you attacked this turn, target opponent discards a card.";

export default defineCard({
  name: "Raiders' Wake",
  manaCost: "{3}{B}",
  colors: ["B"],
  types: ["enchantment"],
  text: `${LOSS_TEXT}\n${RAID_TEXT}`,
  triggered: [
    {
      // Liliana's Caress: once per card, "that player" the discarding player.
      trigger: { on: "discards", who: "opponent", perCard: true },
      targets: [],
      effect: { kind: "lose-life", amount: 2, who: "trigger-controller" },
      resolve: null,
      text: LOSS_TEXT,
    },
    {
      // Alesha's raid: an intervening "if" on the turn's attacks.
      trigger: { on: "step-begins", step: "end", who: "you" },
      condition: { kind: "turn-stat", stat: "attacked", who: "you", atLeast: 1 },
      targets: ["opponent"],
      effect: { kind: "discard", target: 0, amount: 1 },
      resolve: null,
      text: RAID_TEXT,
    },
  ],
});
