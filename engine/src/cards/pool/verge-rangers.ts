import { defineCard } from "../define.js";

// EDHREC rank 5424.
//
// Rulings:
//   [2020-04-17] Verge Rangers doesn't allow you to play additional lands.
//   [2020-04-17] Verge Rangers lets you look at the top card of your library whenever you want
//     (with one restriction; see below), even if you don't have priority. This action doesn't use
//     the stack. Knowing what that card is becomes part of the information you have access to,
//     just like you can look at the cards in your hand.
//   [2020-04-17] If the top card of your library changes while you're casting a spell, playing a
//     land, or activating an ability, you can't look at the new top card until you finish doing
//     so. This means that if you play a land from the top of your library and it has a replacement
//     effect that requires you to make a decision (such as that of Temple Garden), you must make
//     that decision without knowing the next card of your library.

export default defineCard({
  name: "Verge Rangers",
  manaCost: "{2}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Human", "Scout", "Ranger"],
  power: 3,
  toughness: 3,
  keywords: ["first-strike"],
  text: "First strike\nYou may look at the top card of your library any time.\nAs long as an opponent controls more lands than you, you may play lands from the top of your library. (You can play a land this way only if you have an available land play remaining.)",
  looksAtOwnLibraryTop: true,
  static: [
    {
      affects: { scope: "self" },
      condition: { kind: "opponent-controls-more", filter: { type: "land" } },
      playFromLibraryTop: { type: "land" },
      text: "As long as an opponent controls more lands than you, you may play lands from the top of your library.",
    },
  ],
});
