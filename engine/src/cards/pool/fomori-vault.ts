import { defineCard } from "../define.js";
import { addManaAbility } from "../helpers.js";

const TEXT =
  "{3}, {T}, Discard a card: Look at the top X cards of your library, where X is the number of artifacts you control. Put one of those cards into your hand and the rest on the bottom of your library in a random order.";

// X is counted as the ability resolves.
export default defineCard({
  name: "Fomori Vault",
  types: ["land"],
  text: `{T}: Add {C}.\n${TEXT}`,
  activated: [
    addManaAbility({ mana: "C", text: "{T}: Add {C}." }),
    {
      cost: { mana: "{3}", tap: true, discard: { count: 1 } },
      targets: [],
      effect: {
        kind: "look-and-choose",
        zone: "library",
        count: { countOf: { type: "artifact", controlledBy: "you" } },
        min: 1,
        max: 1,
        destination: "hand",
        leftover: "bottom-random",
      },
      resolve: null,
      text: TEXT,
    },
  ],
});
