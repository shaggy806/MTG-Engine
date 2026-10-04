import { defineCard } from "../define.js";

// EDHREC rank 2693.
//
// Rulings:
//   [2016-07-13] If you don't cast the card, perhaps because you choose not to or because it's a
//     land card, it remains exiled.
//   [2016-07-13] If the card has {X} in its mana cost, you must choose 0 as the value of X when
//     casting it without paying its mana cost.
//   [2016-07-13] If you cast the exiled card, you do so as part of the resolution of Mind's
//     Dilation's ability. You can't wait to cast it later in the turn. Timing permissions based on
//     the card's type are ignored, but other restrictions (such as "Cast [this card] only during
//     combat") are not.
//   [2016-07-13] If you cast an instant or sorcery card this way, it goes to its owner's graveyard
//     as normal. It doesn't return to exile.
//   [2016-07-13] If you cast a card "without paying its mana cost," you can't choose to cast it
//     for any alternative costs, such as emerge costs. You can, however, pay additional costs,
//     such as escalate costs. If the card has any mandatory additional costs, you must pay those.
//   [2016-07-13] If you cast the card this way, it will resolve before the spell that caused
//     Mind's Dilation's ability to trigger.

const TEXT =
  "Whenever an opponent casts their first spell each turn, that player exiles the top card of their library. " +
  "If it's a nonland card, you may cast it without paying its mana cost.";

// Gix, Yawgmoth Praetor's shape, for one card: cast as the ability resolves
// (timing permissions ignored), X is 0, and a card not cast — a land, or one
// declined — stays exiled (the rulings).
export default defineCard({
  name: "Mind's Dilation",
  manaCost: "{5}{U}{U}",
  colors: ["U"],
  types: ["enchantment"],
  text: TEXT,
  triggered: [
    {
      trigger: { on: "cast-spell", who: "opponent", firstEachTurn: true },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "exile-from-library", whose: "trigger-controller", amount: 1 },
          { kind: "cast-now", from: "exiled-this-way", free: true },
        ],
      },
      resolve: null,
      text: TEXT,
    },
  ],
});
