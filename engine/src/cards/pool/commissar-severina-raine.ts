import { defineCard } from "../define.js";

// EDHREC rank 3561.
//
// Rulings:
//   [2022-10-07] In Two-Headed Giant and other formats where multiple players can attack at the
//     same time, Commissar Severina Raine's triggered ability counts all attacking creatures, even
//     those controlled by other players.
//
// X counts every other attacking creature as the ability resolves, whoever
// controls it (Ghalta and Mavren's count).

const ATTACK_TEXT =
  "Leading from the Front — Whenever Commissar Severina Raine attacks, each opponent loses X life, where X is the number of other attacking creatures.";
const SAC_TEXT = "Summary Execution — {2}, Sacrifice another creature: You gain 2 life and draw a card.";

export default defineCard({
  name: "Commissar Severina Raine",
  manaCost: "{1}{W}{B}",
  colors: ["W", "B"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Soldier"],
  power: 2,
  toughness: 2,
  text: `${ATTACK_TEXT}\n${SAC_TEXT}`,
  activated: [
    {
      cost: { mana: "{2}", tap: false, sacrifice: "creature-you-control" },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "gain-life", amount: 2 },
          { kind: "draw", amount: 1 },
        ],
      },
      resolve: null,
      text: SAC_TEXT,
      otherOnly: true,
    },
  ],
  triggered: [
    {
      trigger: { on: "attacks", who: "self" },
      targets: [],
      effect: {
        kind: "lose-life",
        amount: { countOf: { type: "creature", attacking: true }, excludeSelf: true },
        who: "each-opponent",
      },
      resolve: null,
      text: ATTACK_TEXT,
    },
  ],
});
