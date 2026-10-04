import { defineCard } from "../define.js";

// EDHREC rank 4895.
//
// Rulings:
//   [2025-04-04] If you somehow control Barrensteppe Siege and no choice was made for it (perhaps
//     because another permanent on the battlefield became a copy of it), it has neither of the two
//     abilities. (`chosen-on-enter` is false with nothing chosen.)
//   [2025-04-04] Barrensteppe Siege's Mardu ability will check as the end step starts to see if a
//     creature died under your control this turn. If none did, the ability won't trigger at all.
//     (An intervening-if: `turn-history` "died" for you.)
//
// Hollowmurk Siege's shape: each mode is gated on the word chosen as it entered.

const ABZAN_TEXT = "Abzan — At the beginning of your end step, put a +1/+1 counter on each creature you control.";
const MARDU_TEXT =
  "Mardu — At the beginning of your end step, if a creature died under your control this turn, each opponent sacrifices a creature of their choice.";

export default defineCard({
  name: "Barrensteppe Siege",
  manaCost: "{2}{W}{B}",
  colors: ["W", "B"],
  types: ["enchantment"],
  text: `As this enchantment enters, choose Abzan or Mardu.\n• ${ABZAN_TEXT}\n• ${MARDU_TEXT}`,
  chooseOnEnter: ["Abzan", "Mardu"],
  triggered: [
    {
      trigger: { on: "step-begins", step: "end", who: "you" },
      condition: { kind: "chosen-on-enter", value: "Abzan" },
      targets: [],
      effect: { kind: "add-counter-all", filter: { type: "creature", controlledBy: "you" }, counter: "+1/+1", amount: 1 },
      resolve: null,
      text: ABZAN_TEXT,
    },
    {
      trigger: { on: "step-begins", step: "end", who: "you" },
      condition: {
        kind: "all",
        of: [
          { kind: "chosen-on-enter", value: "Mardu" },
          { kind: "turn-history", what: "died", who: "you", filter: { type: "creature" } },
        ],
      },
      targets: [],
      effect: { kind: "sacrifice", who: "each-opponent", filter: { type: "creature" }, count: 1 },
      resolve: null,
      text: MARDU_TEXT,
    },
  ],
});
