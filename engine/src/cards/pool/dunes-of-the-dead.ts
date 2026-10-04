import { defineCard } from "../define.js";

// EDHREC rank 5782.
// Makes Zombie → use "Zombie Token".
//
// Rulings:
//   [2017-04-18] Desert is a land subtype with no special meaning. It doesn't grant the land an
//     intrinsic mana ability. Other cards may care about which lands are Deserts.
//   [2017-07-14] Dunes of the Dead's second ability doesn't allow you to sacrifice it whenever
//     you'd like. You must find another way to get Dunes of the Dead into the graveyard.
//   [2017-07-14] If you sacrifice Dunes of the Dead to pay the activation cost of an ability,
//     you'll create the Zombie token before that activated ability resolves.

export default defineCard({
  name: "Dunes of the Dead",
  colors: [],
  types: ["land"],
  subtypes: ["Desert"],
  text: "{T}: Add {C}.\nWhen this land is put into a graveyard from the battlefield, create a 2/2 black Zombie creature token.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "C", amount: 1 },
      resolve: null,
      text: "{T}: Add {C}.",
    },
  ],
  triggered: [
    {
      trigger: { on: "leaves-battlefield", who: "self", to: ["graveyard"] },
      targets: [],
      effect: { kind: "create-token", token: "Zombie Token", count: 1 },
      resolve: null,
      text: "When this land is put into a graveyard from the battlefield, create a 2/2 black Zombie creature token.",
    },
  ],
});
