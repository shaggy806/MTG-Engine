import { defineCard } from "../define.js";

const TEXT =
  "{T}, Sacrifice this land: Search your library for a basic land card, put it onto the battlefield " +
  "tapped, then shuffle. Then if you control four or more lands, untap that land.";

export default defineCard({
  name: "Fabled Passage",
  types: ["land"],
  text: TEXT,
  activated: [
    {
      cost: { mana: null, tap: true, sacrifice: "self" },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          {
            kind: "search-library",
            filter: { type: "land", supertype: "basic" },
            destination: "battlefield",
            min: 0,
            max: 1,
            enterTapped: true,
          },
          // "That land" is the one this ability put onto the battlefield —
          // the `thisWay` clause, read off this resolution's own events. The
          // count is taken after it arrives (Fabled Passage itself is gone).
          {
            kind: "conditional",
            condition: { kind: "controls", filter: { type: "land" }, atLeast: 4 },
            then: {
              kind: "untap-all",
              filter: { type: "land", thisWay: "put-onto-battlefield" },
            },
          },
        ],
      },
      resolve: null,
      text: TEXT,
    },
  ],
});
