import { defineCard } from "../define.js";
import { manaTapAbility } from "../helpers.js";

/**
 * The first of the Kamigawa Channel-land cycle (rule 702.51a — `AbilityCost`
 * gains `zone: "hand"`, discarding the source card is an implicit part of
 * the cost) and the model for `ActivatedAbility.costReduction`.
 *
 * Drops "That player may search their library for a land card with a basic
 * land type, put it onto the battlefield, then shuffle" — the search is
 * made by *the destroyed permanent's controller*, not this ability's
 * controller, and every effect (`may`, `search-library`) resolves against
 * the effect's own controller today. No card needs an "another player may"
 * effect yet; worth building once one does.
 */
export default defineCard({
  name: "Boseiju, Who Endures",
  supertypes: ["legendary"],
  types: ["land"],
  text:
    "{T}: Add {G}.\n" +
    "Channel — {1}{G}, Discard this card: Destroy target artifact, enchantment, or nonbasic land an opponent controls. This ability costs {1} less to activate for each legendary creature you control.",
  activated: [
    manaTapAbility("G"),
    {
      cost: { mana: "{1}{G}", tap: false },
      targets: ["artifact-enchantment-or-nonbasic-land-an-opponent-controls"],
      effect: { kind: "destroy", target: 0 },
      resolve: null,
      zone: "hand",
      costReduction: {
        reduceGeneric: { countOf: { type: "creature", supertype: "legendary", controlledBy: "you" } },
      },
      text:
        "Channel — {1}{G}, Discard this card: Destroy target artifact, enchantment, or nonbasic land an opponent controls. This ability costs {1} less to activate for each legendary creature you control.",
    },
  ],
});
