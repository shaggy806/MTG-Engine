import { defineCard } from "../define.js";

// EDHREC rank 3574. A Saga (rule 714).
const SEARCH =
  "I, II — Search your library for a legendary creature card, reveal it, put it into your hand, then shuffle.";
const STRIKE = "III — Creatures you control gain double strike until end of turn. The Ring tempts you.";

export default defineCard({
  name: "War of the Last Alliance",
  manaCost: "{3}{W}",
  colors: ["W"],
  types: ["enchantment"],
  subtypes: ["Saga"],
  text: `(As this Saga enters and after your draw step, add a lore counter. Sacrifice after III.)\n${SEARCH}\n${STRIKE}`,
  chapters: [
    {
      at: [1, 2],
      targets: [],
      effect: {
        kind: "search-library",
        filter: { type: "creature", supertype: "legendary" },
        destination: "hand",
        min: 0,
        max: 1,
        reveal: true,
      },
      resolve: null,
      text: SEARCH,
    },
    {
      at: [3],
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          {
            kind: "grant-keyword-all",
            filter: { type: "creature", controlledBy: "you" },
            keyword: "double-strike",
            duration: "end-of-turn",
          },
          { kind: "the-ring-tempts-you" },
        ],
      },
      resolve: null,
      text: STRIKE,
    },
  ],
});
