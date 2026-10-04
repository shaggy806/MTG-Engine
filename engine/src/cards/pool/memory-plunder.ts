import { defineCard } from "../define.js";

// EDHREC rank 4730.
//
// Rulings:
//   [2008-05-01] If you want to cast the card, you cast it as part of the resolution of Memory
//     Plunder. Timing restrictions based on the card's type are ignored if it's a sorcery. Other
//     casting restrictions are not (such as "Cast [this card] only during combat").
//   [2008-05-01] If you cast a card "without paying its mana cost," you can't pay any alternative
//     costs. On the other hand, if the card has additional costs (such as conspire), you may pay
//     those.
//   [2008-05-01] If you are unable to cast the card (there are no legal targets for the spell, for
//     example), nothing happens when Memory Plunder resolves, and the card remains in its owner's
//     graveyard.
// `cast-now` with `free` (rule 608.2g): timing ignored, X is 0, kicker and
// additional costs still payable; a card that can't be cast stays put.

const TEXT =
  "You may cast target instant or sorcery card from an opponent's graveyard without paying its mana cost.";

export default defineCard({
  name: "Memory Plunder",
  manaCost: "{U/B}{U/B}{U/B}{U/B}",
  colors: ["U", "B"],
  types: ["instant"],
  text: TEXT,
  targets: [{ kind: "card-in-graveyard", whose: "opponent", filter: { typesAnyOf: ["instant", "sorcery"] } }],
  effect: { kind: "cast-now", target: 0, free: true },
});
