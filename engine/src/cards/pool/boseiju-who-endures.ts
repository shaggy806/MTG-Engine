import { defineCard } from "../define.js";
import { manaTapAbility } from "../helpers.js";

/**
 * The first of the Kamigawa Channel-land cycle (rule 702.51a — `AbilityCost`
 * gains `zone: "hand"`, discarding the source card is an implicit part of
 * the cost) and the model for `ActivatedAbility.costReduction`.
 *
 * The compensating search is made by *the destroyed permanent's controller*,
 * not this ability's — `search-library`'s `who: { controllerOfTarget }`
 * (Path to Exile) is what addresses them, and reads last-known information
 * (rule 608.2h) so the target's controller is still named after it has gone.
 * `min: 0` is the "**may** search".
 */
export default defineCard({
  name: "Boseiju, Who Endures",
  supertypes: ["legendary"],
  types: ["land"],
  text:
    "{T}: Add {G}.\n" +
    "Channel — {1}{G}, Discard this card: Destroy target artifact, enchantment, or nonbasic " +
    "land an opponent controls. That player may search their library for a land card with a " +
    "basic land type, put it onto the battlefield, then shuffle. This ability costs {1} less " +
    "to activate for each legendary creature you control.",
  activated: [
    manaTapAbility("G"),
    {
      cost: { mana: "{1}{G}", tap: false },
      targets: ["artifact-enchantment-or-nonbasic-land-an-opponent-controls"],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "destroy", target: 0 },
          {
            kind: "search-library",
            who: { controllerOfTarget: 0 },
            // "a land card with a basic land type" — any of the five, so a
            // typed dual (Sacred Foundry) qualifies as well as a basic.
            filter: { type: "land", subtypes: ["Plains", "Island", "Swamp", "Mountain", "Forest"] },
            destination: "battlefield",
            min: 0,
            max: 1,
          },
        ],
      },
      resolve: null,
      zone: "hand",
      costReduction: {
        reduceGeneric: { countOf: { type: "creature", supertype: "legendary", controlledBy: "you" } },
      },
      text:
        "Channel — {1}{G}, Discard this card: Destroy target artifact, enchantment, or nonbasic " +
        "land an opponent controls. That player may search their library for a land card with a " +
        "basic land type, put it onto the battlefield, then shuffle. This ability costs {1} less " +
        "to activate for each legendary creature you control.",
    },
  ],
});
