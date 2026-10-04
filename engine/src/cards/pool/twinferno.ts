import { defineCard } from "../define.js";

// EDHREC rank 2621.
//
// Rulings:
//   [2022-09-09] If the spell that's copied has damage divided as it was cast, the division can't
//     be changed (although the targets receiving that damage still can). The same is true of
//     spells that distribute counters.
//   [2022-09-09] You can't choose to pay any additional costs for the copy created by Twinferno's
//     delayed triggered ability. However, effects based on any additional costs that were paid
//     for the original spell are copied as though those same costs were paid for the copy too.
//   [2022-09-09] If the spell that's copied is modal (that is, it says "Choose one —" or the
//     like), the copy created by Twinferno's delayed triggered ability will have the same mode or
//     modes. You can't choose different ones.
//   [2022-09-09] The copies that Twinferno's ability creates are created on the stack, so they're
//     not "cast." Abilities that trigger when a player casts a spell won't trigger.

const COPY_TEXT =
  "When you cast your next instant or sorcery spell this turn, copy that spell. You may choose new targets for the copy.";
const STRIKE_TEXT = "Target creature you control gains double strike until end of turn.";

export default defineCard({
  name: "Twinferno",
  manaCost: "{1}{R}",
  colors: ["R"],
  types: ["instant"],
  text:
    "Choose one —\n" +
    `• ${COPY_TEXT}\n` +
    `• ${STRIKE_TEXT} (It deals both first-strike and regular combat damage.)`,
  castModal: {
    minModes: 1,
    maxModes: 1,
    modes: [
      {
        // Adaptive Training Post's delayed trigger: the copy keeps the
        // spell's modes, X, division and paid costs, and is made from the
        // spell as it last was even if it was countered in response.
        text: COPY_TEXT,
        targets: [],
        effect: {
          kind: "delayed-trigger",
          at: { nextSpell: { typesAnyOf: ["instant", "sorcery"] } },
          effect: { kind: "copy-spell", target: "trigger-spell", newTargets: true },
          text: "Copy that spell. You may choose new targets for the copy.",
        },
      },
      {
        text: STRIKE_TEXT,
        targets: ["creature-you-control"],
        effect: { kind: "grant-keyword", target: 0, keyword: "double-strike", duration: "end-of-turn" },
      },
    ],
  },
});
