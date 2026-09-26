import { defineCard } from "../define.js";

const TEXT =
  "{T}, Sacrifice this land: Destroy target land. Its controller may search their library for a basic land " +
  "card, put it onto the battlefield, then shuffle.";

// The search happens even if the land survives (indestructible), but not if
// the target is illegal as the ability resolves (the rulings) — Path to
// Exile's shape, the land entering untapped.
export default defineCard({
  name: "Ghost Quarter",
  colors: [],
  types: ["land"],
  text: `{T}: Add {C}.\n${TEXT}`,
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "C", amount: 1 },
      resolve: null,
      text: "{T}: Add {C}.",
    },
    {
      cost: { mana: null, tap: true, sacrifice: "self" },
      targets: ["land"],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "destroy", target: 0 },
          {
            kind: "search-library",
            who: { controllerOfTarget: 0 },
            filter: { type: "land", supertype: "basic" },
            destination: "battlefield",
            min: 0,
            max: 1,
          },
        ],
      },
      resolve: null,
      text: TEXT,
    },
  ],
});
