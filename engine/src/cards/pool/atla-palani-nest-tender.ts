import { defineCard } from "../define.js";

// Makes Egg → new token "Egg Token" (scaffolded).
// Rulings:
//   [2019-08-23] If there are no creature cards in your library as Atla Palani's last ability
//     resolves, you reveal your library then put it back in a random order.
//   [2019-08-23] If Atla Palani dies at the same time as one or more Eggs you control, its last
//     ability triggers for each of those Eggs.

export default defineCard({
  name: "Atla Palani, Nest Tender",
  manaCost: "{1}{R}{G}{W}",
  colors: ["W", "R", "G"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Shaman"],
  power: 2,
  toughness: 3,
  text: "{2}, {T}: Create a 0/1 green Egg creature token with defender.\nWhenever an Egg you control dies, reveal cards from the top of your library until you reveal a creature card. Put that card onto the battlefield and the rest on the bottom of your library in a random order.",
  activated: [
    {
      cost: { mana: "{2}", tap: true },
      targets: [],
      effect: { kind: "create-token", token: "Egg Token", count: 1 },
      resolve: null,
      text: "{2}, {T}: Create a 0/1 green Egg creature token with defender.",
    },
  ],
  triggered: [
    {
      trigger: { on: "dies", who: "you-control", filter: { type: "creature", subtype: "Egg" } },
      targets: [],
      effect: { kind: "reveal-until", filter: { type: "creature" }, put: "battlefield", rest: "bottom-random" },
      resolve: null,
      text: "Whenever an Egg you control dies, reveal cards from the top of your library until you reveal a creature card. Put that card onto the battlefield and the rest on the bottom of your library in a random order.",
    },
  ],
});
