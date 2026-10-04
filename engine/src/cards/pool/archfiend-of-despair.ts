import { defineCard } from "../define.js";

// EDHREC rank 2689.
//
// Rulings:
//   [2018-06-08] Archfiend of Despair’s last ability counts only how much life was lost. It
//     doesn’t care whether a player also gained life.
//   [2018-06-08] In a Two-Headed Giant game, damage and life loss happen to each player
//     individually. If each player on a team is dealt 2 damage, each of those players loses 2 life
//     and the team’s life total goes down by 4. When Archfiend of Despair’s ability resolves, each
//     of those players again loses 2 life and the team’s life total goes down again by 4; they
//     don’t each lose 4 life.
//   [2018-06-08] The amount of life to lose is determined only as Archfiend of Despair’s triggered
//     ability resolves. For example, if you control two of them and an opponent lost 3 life
//     earlier in the turn, the first ability to resolve would have that player lose 3 life, and
//     the second would have that player lose 6 life.

const LIFE_TEXT = "Your opponents can't gain life.";
const END_TEXT =
  "At the beginning of each end step, each opponent loses life equal to the life that player lost this turn. " +
  "(Damage causes loss of life.)";

// Each opponent's own total, read as the ability resolves (the rulings): a
// second Archfiend's trigger sees the first one's loss too. Life gained
// doesn't offset it.
export default defineCard({
  name: "Archfiend of Despair",
  manaCost: "{6}{B}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Demon"],
  power: 6,
  toughness: 6,
  keywords: ["flying"],
  text: `Flying\n${LIFE_TEXT}\n${END_TEXT}`,
  static: [
    { affects: { scope: "self" }, replacement: { event: "would-gain-life", who: "opponent", prevent: true }, text: LIFE_TEXT },
  ],
  triggered: [
    {
      trigger: { on: "step-begins", step: "end", who: "any" },
      targets: [],
      effect: {
        kind: "for-each-player",
        who: "each-opponent",
        effect: {
          kind: "lose-life",
          who: "that-player",
          amount: { turnStat: "life-lost", who: "that-player" },
        },
      },
      resolve: null,
      text: END_TEXT,
    },
  ],
});
