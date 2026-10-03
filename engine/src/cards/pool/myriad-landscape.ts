import { defineCard } from "../define.js";

// "That share a land type" is a rule over the finds as a set — the search's
// `together` — so two Forests, or a Forest and a Snow-Covered Forest, may be
// found together, a Forest and an Island may not, and one card alone always
// may (the ruling). Both enter at once, tapped.
const SEARCH_TEXT =
  "{2}, {T}, Sacrifice this land: Search your library for up to two basic land cards that share " +
  "a land type, put them onto the battlefield tapped, then shuffle.";

export default defineCard({
  name: "Myriad Landscape",
  colors: [],
  types: ["land"],
  text: `This land enters tapped.\n{T}: Add {C}.\n${SEARCH_TEXT}`,
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
      targets: [],
      effect: {
        kind: "search-library",
        filter: { supertype: "basic", type: "land" },
        destination: "battlefield",
        min: 0,
        max: 2,
        enterTapped: true,
        together: { share: "land-type" },
      },
      resolve: null,
      text: SEARCH_TEXT,
    },
  ],
  static: [
    {
      affects: { scope: "self" },
      replacement: { event: "enters-battlefield", tapped: true },
      text: "This land enters tapped.",
    },
  ],
});
