import { defineCard } from "../define.js";

// EDHREC rank 5749.
//
// Rulings:
//   [2008-04-01] If Oona's Blackguard enters at the same time as another Rogue (due to Living End,
//     for example), that creature doesn't get a +1/+1 counter.
//   [2008-04-01] The effects from more than one of these cards are cumulative. That is, if you
//     have two Oona's Blackguard on the battlefield, Rogue creatures you control enter with two
//     additional +1/+1 counters on them.
//   [2008-04-01] If a Rogue would normally enter with a certain number of +1/+1 counters on it, it
//     enters with that many +1/+1 counters plus one on it instead. If a Rogue would normally enter
//     with no +1/+1 counters on it, it enters with one +1/+1 counter on it instead.
//   [2008-04-01] The creature gets the counter if it would enter under your control. It doesn't
//     matter who owns the creature or what zone it enters from (such as your opponent's graveyard,
//     for example).
//
// Giada, Font of Hope's `others-enter-battlefield` replacement (a permanent
// entering beside it isn't "already" there — the first ruling); the discard is
// Sword of Feast and Famine's "that player" (`trigger-player`).

const REPLACEMENT_TEXT = "Each other Rogue creature you control enters with an additional +1/+1 counter on it.";
const DISCARD_TEXT =
  "Whenever a creature you control with a +1/+1 counter on it deals combat damage to a player, that player discards a card.";

export default defineCard({
  name: "Oona's Blackguard",
  manaCost: "{1}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Faerie", "Rogue"],
  power: 1,
  toughness: 1,
  keywords: ["flying"],
  text: `Flying\n${REPLACEMENT_TEXT}\n${DISCARD_TEXT}`,
  static: [
    {
      affects: { scope: "self" },
      replacement: {
        event: "others-enter-battlefield",
        filter: { type: "creature", subtype: "Rogue", controlledBy: "you" },
        counters: { kind: "+1/+1", amount: 1 },
      },
      text: REPLACEMENT_TEXT,
    },
  ],
  triggered: [
    {
      trigger: {
        on: "deals-combat-damage-to-player",
        who: "you-control",
        filter: { type: "creature", counters: { kind: "+1/+1", compare: { op: "gte", n: 1 } } },
      },
      targets: [],
      effect: { kind: "discard", target: "trigger-player", amount: 1 },
      resolve: null,
      text: DISCARD_TEXT,
    },
  ],
});
