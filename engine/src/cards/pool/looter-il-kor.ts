import { defineCard } from "../define.js";

// EDHREC rank 5355.
//
// Rulings:
//   [2021-03-19] You draw a card and discard a card all while Looter il-Kor's ability is
//     resolving. Nothing can happen in between, and no player can take actions.
//   [2021-03-19] If an attacking creature has multiple evasion abilities, such as shadow and
//     flying, a creature can block it only if that creature satisfies all of the appropriate
//     evasion abilities.
//   [2021-03-19] Multiple instances of shadow on the same creature are redundant.
//   [2021-03-19] Once a creature has been blocked, that creature remains blocked and will deal and
//     be dealt combat damage even if it gains or loses shadow or if the blocking creature gains or
//     loses shadow.

export default defineCard({
  name: "Looter il-Kor",
  manaCost: "{1}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Kor", "Rogue"],
  power: 1,
  toughness: 1,
  text: "Shadow (This creature can block or be blocked by only creatures with shadow.)\nWhenever this creature deals damage to an opponent, draw a card, then discard a card.",
  keywords: ["shadow"],
  triggered: [
    {
      trigger: { on: "deals-damage", who: "self", to: "opponent" },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "draw", amount: 1 },
          { kind: "discard", target: "you", amount: 1 },
        ],
      },
      resolve: null,
      text: "Whenever this creature deals damage to an opponent, draw a card, then discard a card.",
    },
  ],
});
