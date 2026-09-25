import { defineCard } from "../define.js";

const TEXT =
  "{2}, {T}, Sacrifice this land: Destroy target nonbasic land an opponent controls. That land's " +
  "controller may search their library for a basic land card, put it onto the battlefield, then " +
  "shuffle. You may search your library for a basic land card, put it onto the battlefield, then shuffle.";

const BASIC_LAND = { type: "land", supertype: "basic" } as const;

export default defineCard({
  name: "Demolition Field",
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
      cost: { mana: "{2}", tap: true, sacrifice: "self" },
      targets: [
        { kind: "permanent", whose: "opponent", filter: { type: "land", notSupertype: "basic" } },
      ],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "destroy", target: 0 },
          // "That land's controller" is read as it last existed (Path to
          // Exile's shape): the land is already in the graveyard by now.
          {
            kind: "search-library",
            who: { controllerOfTarget: 0 },
            filter: BASIC_LAND,
            destination: "battlefield",
            min: 0,
            max: 1,
          },
          { kind: "search-library", filter: BASIC_LAND, destination: "battlefield", min: 0, max: 1 },
        ],
      },
      resolve: null,
      text: TEXT,
    },
  ],
});
