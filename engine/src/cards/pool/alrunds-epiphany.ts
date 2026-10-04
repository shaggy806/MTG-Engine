import { defineCard } from "../define.js";

// EDHREC rank 4761.
// Makes Bird → use "1/1 Blue Bird Token".
//
// Rulings:
//   [2021-02-05] If you're casting a foretold card from exile for its foretell cost, you can't
//     choose to cast it for any other alternative costs. You can, however, pay additional costs,
//     such as kicker costs. If the card has any mandatory additional costs, those must be paid to
//     cast the spell.
//   [2021-02-05] Exiling Alrund's Epiphany as it resolves is part of its effect. If Alrund's
//     Epiphany doesn't resolve, it will be put into its owner's graveyard. If it's exiled this
//     way, it's exiled face up and doesn't become foretold.
// Temporal Trespass's extra turn and `exileOnResolve`; Saw It Coming's foretell.

export default defineCard({
  name: "Alrund's Epiphany",
  manaCost: "{5}{U}{U}",
  colors: ["U"],
  types: ["sorcery"],
  foretell: { cost: "{4}{U}{U}" },
  exileOnResolve: true,
  text: "Create two 1/1 blue Bird creature tokens with flying. Take an extra turn after this one. Exile Alrund's Epiphany.\nForetell {4}{U}{U} (During your turn, you may pay {2} and exile this card from your hand face down. Cast it on a later turn for its foretell cost.)",
  effect: {
    kind: "sequence",
    effects: [
      { kind: "create-token", token: "1/1 Blue Bird Token", count: 2 },
      { kind: "take-extra-turn" },
    ],
  },
});
