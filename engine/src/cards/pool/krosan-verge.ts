import { defineCard } from "../define.js";

// "A Forest card and a Plains card": one find per slot (the search's
// `together.oneEach`), any card with the subtype — not only a basic, so a
// Forest Plains dual fills either slot. Either may be missed (rule 701.19b),
// and what's found enters at once, tapped.
const SEARCH_TEXT =
  "{2}, {T}, Sacrifice this land: Search your library for a Forest card and a Plains card, put " +
  "them onto the battlefield tapped, then shuffle.";

export default defineCard({
  name: "Krosan Verge",
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
        filter: { subtypes: ["Forest", "Plains"] },
        destination: "battlefield",
        min: 0,
        max: 2,
        enterTapped: true,
        together: {
          oneEach: [
            { label: "a Forest card", filter: { subtype: "Forest" } },
            { label: "a Plains card", filter: { subtype: "Plains" } },
          ],
        },
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
