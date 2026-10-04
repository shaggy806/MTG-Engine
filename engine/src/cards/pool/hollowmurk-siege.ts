import { defineCard } from "../define.js";

// EDHREC rank 3127.
//
// Rulings:
//   [2025-04-04] An ability that triggers when counters are put on a permanent will trigger if
//     that permanent somehow enters the battlefield with those counters. (`counters-put` counts
//     the counters a permanent enters with.)
//   [2025-04-04] If you somehow control Hollowmurk Siege and no choice was made for it, it has
//     neither of the two abilities. (`chosen-on-enter` is false with nothing chosen.)
//
// Windcrag Siege's shape: each mode is gated on the word chosen as it entered.

const SULTAI_TEXT =
  "Sultai — Whenever a counter is put on a creature you control, draw a card. This ability triggers only once each turn.";
const ABZAN_TEXT =
  "Abzan — Whenever you attack, put a +1/+1 counter on target attacking creature. It gains menace until end of turn.";

export default defineCard({
  name: "Hollowmurk Siege",
  manaCost: "{B}{G}",
  colors: ["B", "G"],
  types: ["enchantment"],
  text: `As this enchantment enters, choose Sultai or Abzan.\n• ${SULTAI_TEXT}\n• ${ABZAN_TEXT}`,
  chooseOnEnter: ["Sultai", "Abzan"],
  triggered: [
    {
      trigger: { on: "counters-put", who: "you-control", filter: { type: "creature" } },
      condition: { kind: "chosen-on-enter", value: "Sultai" },
      oncePerTurn: true,
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: SULTAI_TEXT,
    },
    {
      trigger: { on: "attack-with", who: "you", atLeast: 1 },
      condition: { kind: "chosen-on-enter", value: "Abzan" },
      targets: [{ kind: "permanent", whose: "any", filter: { type: "creature", attacking: true } }],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "add-counter", target: 0, counter: "+1/+1", amount: 1 },
          { kind: "grant-keyword", target: 0, keyword: "menace", duration: "end-of-turn" },
        ],
      },
      resolve: null,
      text: ABZAN_TEXT,
    },
  ],
});
