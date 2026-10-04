import { defineCard } from "../define.js";

// EDHREC rank 6045.
//
// Rulings:
//   [2017-09-29] Because damage remains marked on a creature until it's removed as the turn ends,
//     the damage Drover of the Mighty takes during combat may become lethal if you no longer
//     control a Dinosaur later in the turn.

export default defineCard({
  name: "Drover of the Mighty",
  manaCost: "{1}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Human", "Druid"],
  power: 1,
  toughness: 1,
  text: "This creature gets +2/+2 as long as you control a Dinosaur.\n{T}: Add one mana of any color.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "any-color", amount: 1 },
      resolve: null,
      text: "{T}: Add one mana of any color.",
    },
  ],
  static: [
    {
      affects: { scope: "self" },
      condition: { kind: "controls", filter: { subtype: "Dinosaur" }, atLeast: 1 },
      grantPt: [2, 2],
      text: "This creature gets +2/+2 as long as you control a Dinosaur.",
    },
  ],
});
