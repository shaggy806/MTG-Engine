import { defineCard } from "../define.js";

// EDHREC rank 5591.
// Makes Shapeshifter → use "Shapeshifter Token".
//
// Rulings:
//   [2025-11-17] If an effect causes a creature with changeling to lose all abilities, it will
//     remain all creature types, even though it will no longer have changeling. This is because
//     changeling applies before the effect that removes it.
//   [2025-11-17] If an effect causes a creature with changeling to become a new creature type, it
//     will be only that new creature type (unless the effect says "in addition" or similar). It
//     will still have changeling; the effect making it all creature types will simply be
//     overwritten.
//   [2025-11-17] If a token is exiled this way, it will cease to exist and won't return to the
//     battlefield.
//   [2025-11-17] The subtype Shapeshifter that appears on the type line is mostly there to
//     reinforce the flavor. A creature card with changeling is just as much a Kithkin, a Goblin, a
//     Merfolk, and a Brushwagg as it is a Shapeshifter.
//   [2025-11-17] Auras attached to the exiled creature will be put into their owners' graveyards.
//     Equipment attached to the exiled creature will become unattached and remain on the
//     battlefield. Any counters on the exiled creature will cease to exist.
//   [2025-11-17] Changeling is a characteristic-defining ability. It functions in all zones, not
//     only while a card that has it is on the battlefield.

export default defineCard({
  name: "Personify",
  manaCost: "{1}{W}",
  colors: ["W"],
  types: ["instant"],
  text: "Exile target creature you control, then return that card to the battlefield under its owner's control. Create a 1/1 colorless Shapeshifter creature token with changeling. (It's every creature type.)",
  // Blur's flicker, then the token.
  targets: ["creature-you-control"],
  effect: {
    kind: "sequence",
    effects: [
      { kind: "flicker", target: 0 },
      { kind: "create-token", token: "Shapeshifter Token", count: 1 },
    ],
  },
});
