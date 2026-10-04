import { defineCard } from "../define.js";

// EDHREC rank 4308.
//
// Rulings:
//   [2018-07-13] If you wish to cast the exiled card, you must cast it while Chaos Wand's ability
//     is resolving. You can't cast it later in the turn. A spell cast this way may be cast at a
//     time you normally wouldn't be able to cast a spell of that type, but other restrictions
//     (such as "Cast this spell only during combat") are enforced.
//   [2018-07-13] If you cast a card "without paying its mana cost," you can't choose to cast it
//     for any alternative costs. You can, however, pay additional costs. If the card has any
//     mandatory additional costs, such as that of Tormenting Voice, those must be paid to cast the
//     card.
//   [2018-07-13] If you don't cast the exiled instant or sorcery card, it's put on the bottom of
//     that library with the other cards.
//   [2018-07-13] If the exiled card has {X} in its mana cost, you must choose 0 as the value of X
//     when casting it without paying its mana cost.
//   [2018-07-13] If the opponent exiles their entire library without exiling an instant or sorcery
//     card, that player stops exiling cards, and the exiled cards are put into their library in a
//     random order.
//   [2018-07-13] The opponent stops exiling cards as soon as they exile any instant or sorcery
//     card. You don't choose which card type to look for.

// Gríma, Saruman's Footman's reveal-until over the targeted opponent's library
// (Umbris's `whose: 0`): exiled face up until an instant or sorcery card, which
// you may cast free while this resolves; it goes to the bottom in a random
// order with the rest unless it was cast (the rulings).
const TEXT =
  "{4}, {T}: Target opponent exiles cards from the top of their library until they exile an instant or sorcery card. You may cast that card without paying its mana cost. Then put the exiled cards that weren't cast this way on the bottom of that library in a random order.";

export default defineCard({
  name: "Chaos Wand",
  manaCost: "{3}",
  colors: [],
  types: ["artifact"],
  text: TEXT,
  activated: [
    {
      cost: { mana: "{4}", tap: true },
      targets: ["opponent"],
      effect: {
        kind: "reveal-until",
        whose: 0,
        filter: { typesAnyOf: ["instant", "sorcery"] },
        exile: true,
        then: { kind: "cast-now", target: 0, free: true },
        rest: "bottom-random",
      },
      resolve: null,
      text: TEXT,
    },
  ],
});
