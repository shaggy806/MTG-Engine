import { defineCard } from "../define.js";

// EDHREC rank 3083.
//
// Rulings:
//   [2007-05-01] Putting the card onto the battlefield is optional. When the ability resolves, you
//     can choose not to.
//   [2009-10-01] A "creature card" is any card with the type creature, even if it has other types
//     such as artifact, enchantment, or land.

const TEXT = "{G}, {T}: You may put a creature card from your hand onto the battlefield.";

export default defineCard({
  name: "Elvish Piper",
  manaCost: "{3}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Elf", "Shaman"],
  power: 1,
  toughness: 1,
  text: TEXT,
  activated: [
    {
      cost: { mana: "{G}", tap: true },
      targets: [],
      // Sneak Attack's shape, without its rider.
      effect: {
        kind: "look-and-choose",
        zone: "hand",
        min: 0,
        max: 1,
        destination: "battlefield",
        leftover: "stay",
        filter: { type: "creature" },
      },
      resolve: null,
      text: TEXT,
    },
  ],
});
