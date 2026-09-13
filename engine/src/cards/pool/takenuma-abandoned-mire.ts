import { defineCard } from "../define.js";
import { manaTapAbility } from "../helpers.js";

/**
 * Kamigawa Channel-land cycle — see Boseiju, Who Endures for the mechanism.
 * "A creature or planeswalker card" needed `CardFilter.typesAnyOf` (an OR of
 * types, mirroring `subtypes`' existing OR semantics — `types` alone is an
 * AND, so it can't express "creature or planeswalker").
 */
export default defineCard({
  name: "Takenuma, Abandoned Mire",
  supertypes: ["legendary"],
  types: ["land"],
  text:
    "{T}: Add {B}.\n" +
    "Channel — {3}{B}, Discard this card: Mill three cards, then return a creature or planeswalker card from your graveyard to your hand. This ability costs {1} less to activate for each legendary creature you control.",
  activated: [
    manaTapAbility("B"),
    {
      cost: { mana: "{3}{B}", tap: false },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "mill", target: "you", amount: 3 },
          {
            kind: "return-from-graveyard",
            filter: { typesAnyOf: ["creature", "planeswalker"] },
            destination: "hand",
            count: 1,
          },
        ],
      },
      resolve: null,
      zone: "hand",
      costReduction: {
        reduceGeneric: { countOf: { type: "creature", supertype: "legendary", controlledBy: "you" } },
      },
      text:
        "Channel — {3}{B}, Discard this card: Mill three cards, then return a creature or planeswalker card from your graveyard to your hand. This ability costs {1} less to activate for each legendary creature you control.",
    },
  ],
});
