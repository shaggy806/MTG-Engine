import { defineCard } from "../define.js";

// EDHREC rank 3841.
//
// Rulings:
//   [2008-05-01] As the end step begins, Sygg’s ability checks whether a player who is currently
//     your opponent, or a player who was your opponent at the time they left the game, has lost 3
//     or more life over the course of the turn. If so, the ability will trigger. If not, it won’t.
//   [2008-05-01] Sygg’s ability checks only whether life was lost. It doesn’t care whether life
//     was also gained. For example, if an opponent lost 4 life and gained 6 life during the turn,
//     that player will have a higher life total than they started the turn with — but Sygg’s
//     ability will trigger anyway.
//   [2008-05-01] Sygg’s ability checks to see if it triggers at the end of every turn. It doesn’t
//     have to be your turn, and it doesn’t have to be the turn of the opponent that lost life.
//   [2008-05-01] You don’t specify an opponent when the ability triggers. If multiple opponents
//     have lost 3 or more life over the course of the turn, the ability will trigger only once.
//   [2008-05-01] Sygg’s ability will trigger even if Sygg wasn’t on the battlefield at the time
//     some or all of the life was lost.
//   [2008-05-01] It doesn’t matter how the opponent lost life or who caused it, as long as the
//     total loss of life is 3 or more.

export default defineCard({
  name: "Sygg, River Cutthroat",
  manaCost: "{U/B}{U/B}",
  colors: ["U", "B"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Merfolk", "Rogue"],
  power: 1,
  toughness: 3,
  text: "At the beginning of each end step, if an opponent lost 3 or more life this turn, you may draw a card. (Damage causes loss of life.)",
  triggered: [
    {
      trigger: { on: "step-begins", step: "end", who: "any" },
      condition: { kind: "turn-stat", stat: "life-lost", who: "opponent", atLeast: 3 },
      targets: [],
      effect: { kind: "may", prompt: "Draw a card?", effect: { kind: "draw", amount: 1 } },
      resolve: null,
      text: "At the beginning of each end step, if an opponent lost 3 or more life this turn, you may draw a card.",
    },
  ],
});
