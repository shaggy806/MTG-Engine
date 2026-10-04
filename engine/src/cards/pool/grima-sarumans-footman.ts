import { defineCard } from "../define.js";

// EDHREC rank 3174.
//
// Rulings:
//   [2023-06-16] If you choose not to cast the card, it is put on the bottom of its owner's
//     library in a random order along with the other exiled cards.
//   [2023-06-16] If that player exiles their entire library without exiling an instant or sorcery
//     card, they will randomize the order of the exiled cards, and the cards then become that
//     player's library, ending the effect.
//   [2023-06-16] You cast the card while the ability is resolving and still on the stack. You
//     can't wait to cast it later in the turn.
//   [2023-06-16] If the spell you cast has {X} in its mana cost, you must choose 0 as the value of
//     X when casting it without paying its mana cost.
//   [2023-06-16] The cards are exiled face up. All players will be able to see them.

const UNBLOCKABLE_TEXT = "Gríma can't be blocked.";
const TRIGGER_TEXT =
  "Whenever Gríma deals combat damage to a player, that player exiles cards from the top of their library until they exile an instant or sorcery card. You may cast that card without paying its mana cost. Then that player puts the exiled cards that weren't cast this way on the bottom of their library in a random order.";

export default defineCard({
  name: "Gríma, Saruman's Footman",
  manaCost: "{2}{U}{B}",
  colors: ["U", "B"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Advisor"],
  power: 1,
  toughness: 4,
  text: `${UNBLOCKABLE_TEXT}\n${TRIGGER_TEXT}`,
  static: [
    {
      affects: { scope: "self" },
      grantKeywords: ["unblockable"],
      text: UNBLOCKABLE_TEXT,
    },
  ],
  triggered: [
    {
      trigger: { on: "deals-combat-damage-to-player", who: "self" },
      targets: [],
      effect: {
        kind: "reveal-until",
        // The player dealt damage — "that player".
        whose: "that-player",
        filter: { typesAnyOf: ["instant", "sorcery"] },
        exile: true,
        then: { kind: "cast-now", target: 0, free: true },
        // The card found goes with the rest unless it was cast (the ruling).
        rest: "bottom-random",
      },
      resolve: null,
      text: TRIGGER_TEXT,
    },
  ],
});
