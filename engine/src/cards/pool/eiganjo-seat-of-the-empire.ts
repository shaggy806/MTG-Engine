import { defineCard } from "../define.js";
import { manaTapAbility } from "../helpers.js";

/**
 * Kamigawa Channel-land cycle — see Boseiju, Who Endures for the mechanism.
 * "Target attacking or blocking creature" needed a new `TargetSpec`.
 */
export default defineCard({
  name: "Eiganjo, Seat of the Empire",
  supertypes: ["legendary"],
  types: ["land"],
  text:
    "{T}: Add {W}.\n" +
    "Channel — {2}{W}, Discard this card: It deals 4 damage to target attacking or blocking creature. This ability costs {1} less to activate for each legendary creature you control.",
  activated: [
    manaTapAbility("W"),
    {
      cost: { mana: "{2}{W}", tap: false },
      targets: ["attacking-or-blocking-creature"],
      effect: { kind: "damage", amount: 4, target: 0 },
      resolve: null,
      zone: "hand",
      costReduction: {
        reduceGeneric: { countOf: { type: "creature", supertype: "legendary", controlledBy: "you" } },
      },
      text:
        "Channel — {2}{W}, Discard this card: It deals 4 damage to target attacking or blocking creature. This ability costs {1} less to activate for each legendary creature you control.",
    },
  ],
});
