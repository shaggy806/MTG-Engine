import { defineCard } from "../define.js";

// EDHREC rank 3292.
// Makes Human Soldier → use "Human Soldier Token".
//
// Rulings:
//   [2025-07-25] Cosmogrand Zenith’s ability resolves before the spell that caused it to trigger.
//     It resolves even if that spell is countered or otherwise leaves the stack without resolving.
//     Notably, if your second spell is a creature spell and you choose the second mode for
//     Cosmogrand Zenith’s ability, the resulting creature from that spell won’t get a +1/+1
//     counter.
//   [2025-07-25] Cosmogrand Zenith’s ability will count any spells you’ve cast this turn, which
//     may include Cosmogrand Zenith itself. It doesn’t matter if the other spells resolved, didn’t
//     resolve, were countered, or are still on the stack.

const TRIGGER_TEXT = "Whenever you cast your second spell each turn, choose one —";
const TOKENS_MODE = "• Create two 1/1 white Human Soldier creature tokens.";
const COUNTERS_MODE = "• Put a +1/+1 counter on each creature you control.";

export default defineCard({
  name: "Cosmogrand Zenith",
  manaCost: "{2}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Human", "Soldier"],
  power: 2,
  toughness: 4,
  text: `${TRIGGER_TEXT}\n${TOKENS_MODE}\n${COUNTERS_MODE}`,
  triggered: [
    {
      // Aligned Heart's "your second spell each turn"; the mode is announced
      // as the trigger goes on the stack (Atsushi's shape). It resolves above
      // the spell, so a creature spell that triggered it gets no counter.
      trigger: { on: "cast-spell", who: "you", nthEachTurn: 2 },
      targets: [],
      effect: {
        kind: "modal",
        announced: true,
        minModes: 1,
        maxModes: 1,
        modes: [
          { text: TOKENS_MODE, effect: { kind: "create-token", token: "Human Soldier Token", count: 2 } },
          {
            text: COUNTERS_MODE,
            effect: {
              kind: "add-counter-all",
              filter: { type: "creature", controlledBy: "you" },
              counter: "+1/+1",
              amount: 1,
            },
          },
        ],
      },
      resolve: null,
      text: `${TRIGGER_TEXT} ${TOKENS_MODE} ${COUNTERS_MODE}`,
    },
  ],
});
