import { defineCard } from "../define.js";

// EDHREC rank 5087.
//
// X counts the creatures attacking you as it resolves — not one attacking a
// planeswalker of yours (rule 506.3), Arachnogenesis's count. The prevention
// is Fog's, for the rest of the turn.
const SEARCH_TEXT =
  "Search your library for up to X basic land cards, where X is the number of creatures attacking you, put those cards onto the battlefield tapped, then shuffle.";
const FOG_TEXT = "Prevent all combat damage that would be dealt this turn.";

export default defineCard({
  name: "Jaheira's Respite",
  manaCost: "{4}{G}",
  colors: ["G"],
  types: ["instant"],
  text: `${SEARCH_TEXT}\n${FOG_TEXT}`,
  effect: {
    kind: "sequence",
    effects: [
      {
        kind: "search-library",
        filter: { type: "land", supertype: "basic" },
        destination: "battlefield",
        enterTapped: true,
        min: 0,
        max: { attackingPlayer: "each" },
      },
      { kind: "prevent-all-combat-damage" },
    ],
  },
});
