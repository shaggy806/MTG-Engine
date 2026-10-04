import { defineCard } from "../define.js";

// EDHREC rank 2759.
//
// Rulings:
//   [2020-06-23] If the spell that's copied is modal (that is, it says "Choose one —" or the
//     like), the copy will have the same mode or modes. You can't choose different ones.
//   [2020-06-23] If you cast an instant or sorcery spell before Double Vision enters the
//     battlefield during the same turn, its ability can't trigger that turn.
//   [2020-06-23] A copy is created even if the spell that caused Double Vision's ability to
//     trigger has been countered by the time that ability resolves. The copy resolves before the
//     original spell.
//
// `firstEachTurn` with a filter counts every matching spell cast this turn,
// including ones cast before Double Vision arrived (the second ruling).

const COPY_TEXT =
  "Whenever you cast your first instant or sorcery spell each turn, copy that spell. You may choose new targets for the copy.";

export default defineCard({
  name: "Double Vision",
  manaCost: "{3}{R}{R}",
  colors: ["R"],
  types: ["enchantment"],
  text: COPY_TEXT,
  triggered: [
    {
      trigger: {
        on: "cast-spell",
        who: "you",
        firstEachTurn: true,
        filter: { typesAnyOf: ["instant", "sorcery"] },
      },
      targets: [],
      effect: { kind: "copy-spell", target: "trigger-spell", newTargets: true },
      resolve: null,
      text: COPY_TEXT,
    },
  ],
});
