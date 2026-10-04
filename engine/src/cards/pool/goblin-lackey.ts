import { defineCard } from "../define.js";

// EDHREC rank 4847.
//
// Rulings:
//   [2008-08-01] A Goblin permanent card is an artifact, creature, land, and/or enchantment card
//     with the creature type "Goblin". Usually such cards will be creatures in addition to any
//     other types, but they may be kindred instead. For example, you could put Boggart Shenanigans
//     onto the battlefield with this effect.

// Any damage to a player, combat or not. "A Goblin permanent card" is any
// card with the Goblin subtype that isn't an instant or sorcery (the ruling;
// Moggcatcher's filter), put onto the battlefield untapped.
const TEXT =
  "Whenever this creature deals damage to a player, you may put a Goblin permanent card from your hand onto the battlefield.";

export default defineCard({
  name: "Goblin Lackey",
  manaCost: "{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Goblin"],
  power: 1,
  toughness: 1,
  text: TEXT,
  triggered: [
    {
      trigger: { on: "deals-damage", who: "self", to: "player" },
      targets: [],
      effect: {
        kind: "look-and-choose",
        zone: "hand",
        min: 0,
        max: 1,
        destination: "battlefield",
        leftover: "stay",
        filter: { subtype: "Goblin", notTypes: ["instant", "sorcery"] },
      },
      resolve: null,
      text: TEXT,
    },
  ],
});
