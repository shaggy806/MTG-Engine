import { defineCard } from "../define.js";

// EDHREC rank 3547.
//
// Rulings:
//   [2016-09-20] If the card has {X} in its mana cost, you must choose 0 as the value of X when
//     casting it without paying its mana cost.
//   [2016-09-20] If you cast a card "without paying its mana cost," you can't choose to cast it
//     for any alternative costs, such as emerge costs. You can, however, pay additional costs. If
//     the card has any mandatory additional costs, such as that of Incendiary Sabotage, you must
//     pay those to cast the card.
//   [2016-09-20] The card cast with Aetherworks Marvel's second ability is cast from your library.
//   [2016-09-20] Aetherworks Marvel's first ability triggers whenever any permanent you control is
//     put into a graveyard from the battlefield, including Aetherworks Marvel itself and other
//     permanents put into a graveyard at the same time as it.
//   [2016-09-20] Tokens that are sacrificed or destroyed are put into their owner's graveyard
//     before ceasing to exist. If you controlled the token, Aetherworks Marvel's first ability
//     will trigger.
//
// The first ability is a leaves-the-battlefield trigger to a graveyard (it
// looks back in time, so it sees itself and tokens go). The second is
// Velomachus Lorehold's `cast-now` from the top six, any spell, free.
const ENERGY_TEXT = "Whenever a permanent you control is put into a graveyard, you get {E} (an energy counter).";
const CAST_TEXT =
  "{T}, Pay six {E}: Look at the top six cards of your library. You may cast a spell from among them without paying its mana cost. Put the rest on the bottom of your library in a random order.";

export default defineCard({
  name: "Aetherworks Marvel",
  manaCost: "{4}",
  colors: [],
  supertypes: ["legendary"],
  types: ["artifact"],
  text: `${ENERGY_TEXT}\n${CAST_TEXT}`,
  triggered: [
    {
      trigger: { on: "leaves-battlefield", who: "you-control", to: ["graveyard"] },
      targets: [],
      effect: { kind: "get-energy", amount: 1 },
      resolve: null,
      text: ENERGY_TEXT,
    },
  ],
  activated: [
    {
      cost: { mana: null, tap: true, payEnergy: 6 },
      targets: [],
      effect: {
        kind: "cast-now",
        from: { libraryTop: 6 },
        free: true,
        rest: "bottom-random",
      },
      resolve: null,
      text: CAST_TEXT,
    },
  ],
});
