import { defineCard } from "../define.js";

// EDHREC rank 3881.
// Makes Mutavault → new token "Mutavault Token" (scaffolded).
//
// Rulings:
//   [2025-11-17] Mutable Explorer's last ability creates a token that's a copy of the card
//     Mutavault in the Oracle card reference. Official text for Mutavault can be found using the
//     Gatherer card database at Gatherer.Wizards.com.
//   [2025-11-17] If an effect causes a creature with changeling to become a new creature type, it
//     will be only that new creature type (unless the effect says "in addition" or similar). It
//     will still have changeling; the effect making it all creature types will simply be
//     overwritten.
//   [2025-11-17] The subtype Shapeshifter that appears on the type line is mostly there to
//     reinforce the flavor. A creature card with changeling is just as much a Kithkin, a Goblin, a
//     Merfolk, and a Brushwagg as it is a Shapeshifter.
//   [2025-11-17] Changeling is a characteristic-defining ability. It functions in all zones, not
//     only while a card that has it is on the battlefield.
//   [2025-11-17] If an effect causes a creature with changeling to lose all abilities, it will
//     remain all creature types, even though it will no longer have changeling. This is because
//     changeling applies before the effect that removes it.

export default defineCard({
  name: "Mutable Explorer",
  manaCost: "{2}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Shapeshifter"],
  power: 1,
  toughness: 1,
  keywords: ["changeling"],
  text: "Changeling (This card is every creature type.)\nWhen this creature enters, create a tapped Mutavault token. (It's a land with \"{T}: Add {C}\" and \"{1}: This token becomes a 2/2 creature with all creature types until end of turn. It's still a land.\")",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: { kind: "create-token", token: "Mutavault Token", count: 1, tapped: true },
      resolve: null,
      text: "When this creature enters, create a tapped Mutavault token.",
    },
  ],
});
