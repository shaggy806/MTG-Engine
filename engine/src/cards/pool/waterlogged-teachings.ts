import { defineCard } from "../define.js";

/** A modal double-faced card (instant // land) — its back face, Inundated
 * Archive, is a land you play instead. */
export default defineCard({
  name: "Waterlogged Teachings",
  manaCost: "{3}{U/B}",
  colors: ["U", "B"],
  types: ["instant"],
  text:
    "Search your library for an instant card or a card with flash, reveal it, put it into your " +
    "hand, then shuffle.",
  effect: {
    kind: "search-library",
    filter: { anyOf: [{ type: "instant" }, { keyword: "flash" }] },
    destination: "hand",
    min: 0,
    max: 1,
    reveal: true,
  },
  faces: ["Waterlogged Teachings", "Inundated Archive"],
});
