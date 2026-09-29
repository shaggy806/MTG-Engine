import { defineCard } from "../define.js";
import { manaTapAbility } from "../helpers.js";

const CHANNEL_TEXT =
  "Channel — {3}{R}, Discard this card: Create two 1/1 colorless Spirit creature tokens. They gain haste until end of turn. This ability costs {1} less to activate for each legendary creature you control.";

/** Kamigawa Channel-land cycle — see Boseiju, Who Endures for the mechanism. */
export default defineCard({
  name: "Sokenzan, Crucible of Defiance",
  supertypes: ["legendary"],
  types: ["land"],
  text: `{T}: Add {R}.\n${CHANNEL_TEXT}`,
  activated: [
    manaTapAbility("R"),
    {
      cost: { mana: "{3}{R}", tap: false },
      targets: [],
      effect: {
        kind: "create-token",
        token: "Spirit Token (Colorless)",
        count: 2,
        gainUntilEndOfTurn: ["haste"],
      },
      resolve: null,
      zone: "hand",
      costReduction: {
        reduceGeneric: { countOf: { type: "creature", supertype: "legendary", controlledBy: "you" } },
      },
      text: CHANNEL_TEXT,
    },
  ],
});
