import { defineCard } from "../define.js";

// EDHREC rank 2663.
//
// Rulings:
//   [2023-11-10] If Volatile Fault's ability resolves, the target nonbasic land's controller gets
//     to search for a basic land card even if the land wasn't destroyed by Volatile Fault's
//     ability. This may happen because the land has indestructible. In this case, you'll still
//     create a Treasure token.
//   [2023-11-10] If the target of Volatile Fault's last ability is illegal as the ability tries to
//     resolve, it won't resolve and none of its effects will happen. You won't create a Treasure
//     token.

const TEXT =
  "{1}, {T}, Sacrifice this land: Destroy target nonbasic land an opponent controls. That player may " +
  "search their library for a basic land card, put it onto the battlefield, then shuffle. You create a " +
  "Treasure token.";

const BASIC_LAND = { type: "land", supertype: "basic" } as const;

// Demolition Field's shape. The search and the Treasure don't depend on the
// land being destroyed (an indestructible one stays — the ruling); "that
// player" is the land's controller as it last existed.
export default defineCard({
  name: "Volatile Fault",
  colors: [],
  types: ["land"],
  subtypes: ["Cave"],
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
      cost: { mana: "{1}", tap: true, sacrifice: "self" },
      targets: [
        { kind: "permanent", whose: "opponent", filter: { type: "land", notSupertype: "basic" } },
      ],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "destroy", target: 0 },
          {
            kind: "search-library",
            who: { controllerOfTarget: 0 },
            filter: BASIC_LAND,
            destination: "battlefield",
            min: 0,
            max: 1,
          },
          { kind: "create-token", token: "Treasure Token", count: 1 },
        ],
      },
      resolve: null,
      text: TEXT,
    },
  ],
});
