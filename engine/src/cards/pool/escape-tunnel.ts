import { defineCard } from "../define.js";

const SEARCH_TEXT =
  "{T}, Sacrifice this land: Search your library for a basic land card, put it onto the battlefield tapped, then shuffle.";
const EVADE_TEXT = "{T}, Sacrifice this land: Target creature with power 2 or less can't be blocked this turn.";

// The power is checked as it's targeted and again on resolution (the
// ruling): grown past 2 in response, it fizzles; grown after, it stays
// unblockable. A creature already blocked stays blocked.
export default defineCard({
  name: "Escape Tunnel",
  colors: [],
  types: ["land"],
  text: `${SEARCH_TEXT}\n${EVADE_TEXT}`,
  activated: [
    {
      cost: { mana: null, tap: true, sacrifice: "self" },
      targets: [],
      effect: {
        kind: "search-library",
        filter: { type: "land", supertype: "basic" },
        destination: "battlefield",
        min: 0,
        max: 1,
        enterTapped: true,
      },
      resolve: null,
      text: SEARCH_TEXT,
    },
    {
      cost: { mana: null, tap: true, sacrifice: "self" },
      targets: [{ kind: "permanent", filter: { type: "creature", power: { op: "lte", n: 2 } } }],
      effect: { kind: "grant-keyword", target: 0, keyword: "unblockable", duration: "end-of-turn" },
      resolve: null,
      text: EVADE_TEXT,
    },
  ],
});
