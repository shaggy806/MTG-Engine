import { defineCard } from "../define.js";
import { manaTapAbility } from "../helpers.js";

/** Kamigawa Channel-land cycle — see Boseiju, Who Endures for the mechanism. */
export default defineCard({
  name: "Otawara, Soaring City",
  supertypes: ["legendary"],
  types: ["land"],
  text:
    "{T}: Add {U}.\n" +
    "Channel — {3}{U}, Discard this card: Return target artifact, creature, enchantment, or planeswalker to its owner's hand. This ability costs {1} less to activate for each legendary creature you control.",
  activated: [
    manaTapAbility("U"),
    {
      cost: { mana: "{3}{U}", tap: false },
      targets: ["nonland-permanent"],
      effect: { kind: "return-to-hand", target: 0 },
      resolve: null,
      zone: "hand",
      costReduction: {
        reduceGeneric: { countOf: { type: "creature", supertype: "legendary", controlledBy: "you" } },
      },
      text:
        "Channel — {3}{U}, Discard this card: Return target artifact, creature, enchantment, or planeswalker to its owner's hand. This ability costs {1} less to activate for each legendary creature you control.",
    },
  ],
});
