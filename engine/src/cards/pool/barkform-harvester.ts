import { defineCard } from "../define.js";

// EDHREC rank 4362.
//
// Rulings:
//   [2024-07-26] If an effect causes a creature with changeling to become a new creature type, it
//     will be only that new creature type. It will still have changeling; the effect making it all
//     creature types will simply be overwritten.
//   [2024-07-26] If an effect causes a creature with changeling to lose all abilities, it will
//     remain all creature types, even though it will no longer have changeling. This is because
//     changeling applies before the effect that removes it.
//   [2024-07-26] The subtype Shapeshifter that appears on the type line is mostly there to
//     reinforce the flavor. A creature card with changeling is just as much a Mouse, a Frog, a
//     Rabbit, a Lizard, and a Brushwagg as it is a Shapeshifter.
//   [2024-07-26] Changeling is a characteristic-defining ability. It functions in all zones, not
//     only while a card that has it is on the battlefield.

const PUT_TEXT = "{2}: Put target card from your graveyard on the bottom of your library.";

export default defineCard({
  name: "Barkform Harvester",
  manaCost: "{3}",
  colors: [],
  types: ["artifact", "creature"],
  subtypes: ["Shapeshifter"],
  power: 2,
  toughness: 3,
  keywords: ["changeling", "reach"],
  text: `Changeling (This card is every creature type.)\nReach\n${PUT_TEXT}`,
  activated: [
    {
      cost: { mana: "{2}", tap: false },
      targets: [{ kind: "card-in-graveyard", whose: "you", filter: {} }],
      effect: { kind: "put-on-library", target: 0, position: "bottom" },
      resolve: null,
      text: PUT_TEXT,
    },
  ],
});
