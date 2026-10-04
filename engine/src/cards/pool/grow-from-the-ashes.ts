import { defineCard } from "../define.js";

// EDHREC rank 3501.
//
// Rulings:
//   [2024-11-08] To determine a spell's total cost, start with the mana cost (or an alternative
//     cost if another card's effect allows you to pay one instead), add any cost increases (such
//     as kicker), then apply any cost reductions. The spell's mana value remains unchanged, no
//     matter what the total cost to cast it was.
//   [2024-11-08] If a spell's kicker cost was paid, the spell is "kicked."
//   [2024-11-08] The kicker ability doesn't let you pay a kicker cost more than once.
//   [2024-11-08] If you put a permanent with a kicker ability onto the battlefield without casting
//     it, you can't kick it.
//   [2024-11-08] If you copy a kicked spell on the stack, the copy is also kicked. If the copied
//     spell is a permanent spell, the token the copy of that spell becomes when it enters is also
//     kicked.
//   [2024-11-08] If a card or token enters as a copy of a permanent, the new permanent isn't
//     kicked, even if the original was.

export default defineCard({
  name: "Grow from the Ashes",
  manaCost: "{2}{G}",
  colors: ["G"],
  types: ["sorcery"],
  text: "Kicker {2} (You may pay an additional {2} as you cast this spell.)\nSearch your library for a basic land card, put it onto the battlefield, then shuffle. If this spell was kicked, instead search your library for two basic land cards, put them onto the battlefield, then shuffle.",
  effect: {
    kind: "search-library",
    filter: { supertype: "basic", type: "land" },
    destination: "battlefield",
    min: 0,
    max: 1,
  },
  // Kicked, the search for two replaces the search for one.
  kicker: {
    cost: "{2}",
    effect: {
      kind: "search-library",
      filter: { supertype: "basic", type: "land" },
      destination: "battlefield",
      min: 0,
      max: 2,
    },
  },
});
