import { defineCard } from "../define.js";

// EDHREC rank 3439.
//
// Rulings:
//   [2015-06-22] If the spell mastery ability applies, and you find three basic Forest cards, one
//     of them will be put onto the battlefield tapped and two of them will be put into your hand.
//   [2015-06-22] Check to see if there are two or more instant and/or sorcery cards in your
//     graveyard as the spell resolves to determine whether the spell mastery ability applies. The
//     spell itself won’t count because it’s still on the stack as you make this check.
//   [2015-06-22] If you only find one basic Forest card, you’ll put it onto the battlefield
//     tapped. You won’t be able to put it into your hand, even if you want to.
//
// Cultivate's split tutor: the first card chosen goes onto the battlefield
// tapped and the rest into your hand; finding only one puts it onto the
// battlefield (the ruling). Spell mastery is checked as it resolves, the
// spell itself still on the stack (the ruling).

export default defineCard({
  name: "Nissa's Pilgrimage",
  manaCost: "{2}{G}",
  colors: ["G"],
  types: ["sorcery"],
  text: "Search your library for up to two basic Forest cards, reveal those cards, and put one onto the battlefield tapped and the rest into your hand. Then shuffle.\nSpell mastery — If there are two or more instant and/or sorcery cards in your graveyard, search your library for up to three basic Forest cards instead of two.",
  effect: {
    kind: "conditional",
    condition: { kind: "cards-in-graveyard", atLeast: 2, filter: { typesAnyOf: ["instant", "sorcery"] } },
    then: {
      kind: "search-library",
      filter: { supertype: "basic", subtype: "Forest" },
      min: 0,
      max: 3,
      destination: "battlefield",
      enterTapped: true,
      reveal: true,
      restDestination: "hand",
    },
    else: {
      kind: "search-library",
      filter: { supertype: "basic", subtype: "Forest" },
      min: 0,
      max: 2,
      destination: "battlefield",
      enterTapped: true,
      reveal: true,
      restDestination: "hand",
    },
  },
});
